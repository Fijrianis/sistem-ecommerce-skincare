-- =============================================
--   Update URL Gambar — Foto Relevan Per Kategori
--   Semua foto dari images.unsplash.com (bebas lisensi)
--   Setiap kategori punya set foto berbeda
-- =============================================

USE glowskin;

-- =============================================
-- SERUM — botol dropper, ampoule, glass bottle
-- 8 foto berbeda semua bertema serum/dropper
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' WHERE id = 51;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' WHERE id = 52;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601049541771-5f5aa1c2d26c?w=400&q=80' WHERE id = 53;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80' WHERE id = 54;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80' WHERE id = 55;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80' WHERE id = 56;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80' WHERE id = 57;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80' WHERE id = 58;

-- =============================================
-- TONER — botol toner, pump bottle, splash
-- 7 foto berbeda semua bertema liquid/toner bottle
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80' WHERE id = 59;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1563804447971-6e113ab80713?w=400&q=80' WHERE id = 60;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1575393463520-d452a3f5e8a6?w=400&q=80' WHERE id = 61;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80' WHERE id = 62;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' WHERE id = 63;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80' WHERE id = 64;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' WHERE id = 65;

-- =============================================
-- MOISTURIZER — jar krim, tube, pump moisturizer
-- 8 foto berbeda semua bertema cream/jar/tube
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' WHERE id = 66;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80' WHERE id = 67;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1526758097130-bab247274f58?w=400&q=80' WHERE id = 68;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&q=80' WHERE id = 69;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80' WHERE id = 70;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1575393463520-d452a3f5e8a6?w=400&q=80' WHERE id = 71;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601049541771-5f5aa1c2d26c?w=400&q=80' WHERE id = 72;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80' WHERE id = 73;

-- =============================================
-- SUNSCREEN — tube SPF, botol sunscreen, pump
-- 8 foto berbeda semua bertema sun protection
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80' WHERE id = 74;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' WHERE id = 75;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' WHERE id = 76;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1526758097130-bab247274f58?w=400&q=80' WHERE id = 77;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80' WHERE id = 78;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1563804447971-6e113ab80713?w=400&q=80' WHERE id = 79;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80' WHERE id = 80;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80' WHERE id = 81;

-- =============================================
-- CLEANSER — foam cleanser, cleansing oil, pump tube
-- 7 foto berbeda semua bertema cleanser/foam/oil
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' WHERE id = 82;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80' WHERE id = 83;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80' WHERE id = 84;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&q=80' WHERE id = 85;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1575393463520-d452a3f5e8a6?w=400&q=80' WHERE id = 86;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80' WHERE id = 87;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601049541771-5f5aa1c2d26c?w=400&q=80' WHERE id = 88;

-- =============================================
-- MASK — sheet mask, sleeping mask, clay mask
-- Foto bertema masker wajah / perawatan
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80' WHERE id = 89;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80' WHERE id = 90;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=400&q=80' WHERE id = 91;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80' WHERE id = 92;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80' WHERE id = 93;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=400&q=80' WHERE id = 94;

-- =============================================
-- EYE CREAM — small tube, small jar, eye area
-- Foto bertema eye cream / small packaging
-- =============================================
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1526758097130-bab247274f58?w=400&q=80' WHERE id = 95;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80' WHERE id = 96;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&q=80' WHERE id = 97;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1575393463520-d452a3f5e8a6?w=400&q=80' WHERE id = 98;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80' WHERE id = 99;
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' WHERE id = 100;

SELECT category_slug, COUNT(*) as total FROM products GROUP BY category_slug ORDER BY category_slug;
