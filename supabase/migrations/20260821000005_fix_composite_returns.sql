-- SellerOS — 0005: fix composite return statements
--
-- `RETURN (SELECT * FROM …)` is invalid for composite return types in
-- PL/pgSQL ("subquery must return only one column", SQLSTATE 42601).
-- The functions below returned a rowtype; they now use
-- `RETURN QUERY SELECT * …` which is the correct form.
-- Privileges are preserved by CREATE OR REPLACE.

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
  v_inv public.inventory_items;
begin
  if p_new_status not in ('confirmed', 'ready', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if not public.is_business_member(v_order.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;

  if not (
    (v_order.status = 'pending' and p_new_status in ('confirmed', 'cancelled')) or
    (v_order.status = 'confirmed' and p_new_status in ('ready', 'cancelled')) or
    (v_order.status = 'ready' and p_new_status in ('shipped', 'cancelled')) or
    (v_order.status = 'shipped' and p_new_status = 'delivered')
  ) then
    raise exception 'INVALID_TRANSITION';
  end if;

  if p_new_status = 'shipped' then
    for v_item in select * from public.order_items where order_id = v_order.id loop
      if v_item.product_id is not null then
        select * into v_inv
        from public.inventory_items
        where product_id = v_item.product_id
        for update;
        if not found then
          raise exception 'PRODUCT_NOT_FOUND';
        end if;
        if v_inv.stock < v_item.quantity then
          raise exception 'INSUFFICIENT_STOCK';
        end if;
        update public.inventory_items
        set stock = v_inv.stock - v_item.quantity,
            reserved = v_inv.reserved - v_item.quantity
        where id = v_inv.id;
        insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
        values (v_order.business_id, v_item.product_id, 'sale', -v_item.quantity, v_inv.stock, v_inv.stock - v_item.quantity, 'order ' || v_order.display_id, auth.uid());
      end if;
    end loop;
  end if;

  if p_new_status = 'cancelled' then
    for v_item in select * from public.order_items where order_id = v_order.id loop
      if v_item.product_id is not null then
        select * into v_inv
        from public.inventory_items
        where product_id = v_item.product_id
        for update;
        if not found then
          raise exception 'PRODUCT_NOT_FOUND';
        end if;
        update public.inventory_items
        set reserved = greatest(v_inv.reserved - v_item.quantity, 0)
        where id = v_inv.id;
        insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
        values (v_order.business_id, v_item.product_id, 'release', -v_item.quantity, v_inv.stock, v_inv.stock, 'order ' || v_order.display_id, auth.uid());
      end if;
    end loop;
  end if;

  update public.orders set status = p_new_status where id = v_order.id;

  insert into public.order_status_history (business_id, order_id, status, changed_by)
  values (v_order.business_id, v_order.id, p_new_status, auth.uid());

  if p_new_status = 'cancelled' then
    perform public.log_audit(v_order.business_id, 'order.cancelled', 'order', v_order.id::text,
                             jsonb_build_object('display_id', v_order.display_id));
  end if;

  v_order.status := p_new_status;
  return v_order;
exception
  when others then
    if sqlstate = 'P0001' then
      raise;  -- our own safe error codes pass through
    end if;
    raise exception 'OPERATION_FAILED';
end;
$$;

create or replace function public.adjust_inventory(
  p_product_id uuid,
  p_new_stock int,
  p_reason text default ''
)
returns public.inventory_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.inventory_items;
  v_type text;
begin
  select * into v_inv from public.inventory_items where product_id = p_product_id for update;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;
  if not public.is_business_member(v_inv.business_id) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'INVALID_STOCK';
  end if;
  if p_new_stock < v_inv.reserved then
    raise exception 'STOCK_BELOW_RESERVED';
  end if;

  if v_inv.stock <> p_new_stock then
    v_type := case when p_new_stock > v_inv.stock then 'restock' else 'manual_adjustment' end;

    insert into public.inventory_movements (business_id, product_id, type, quantity_change, previous_stock, new_stock, reason, actor_id)
    values (v_inv.business_id, p_product_id, v_type, p_new_stock - v_inv.stock, v_inv.stock, p_new_stock, nullif(p_reason, ''), auth.uid());

    update public.inventory_items set stock = p_new_stock where id = v_inv.id;

    perform public.log_audit(v_inv.business_id, 'inventory.adjusted', 'inventory_item', p_product_id::text,
                             jsonb_build_object('previous_stock', v_inv.stock, 'new_stock', p_new_stock, 'reason', p_reason));
  end if;

  v_inv.stock := p_new_stock;
  return v_inv;
exception
  when others then
    if sqlstate = 'P0001' then
      raise;
    end if;
    raise exception 'OPERATION_FAILED';
end;
$$;
