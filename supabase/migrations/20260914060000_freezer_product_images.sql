-- Preserve the exact catalog identity when food is transferred from Cart.
-- Images are read from the linked product, so catalog image updates are reflected.
alter table public.freezer_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

create index if not exists freezer_items_product_idx
  on public.freezer_items(product_id) where product_id is not null;

notify pgrst, 'reload schema';
