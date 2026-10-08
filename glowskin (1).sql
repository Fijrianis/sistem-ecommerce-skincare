-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20260519.eecbf60603
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 07, 2026 at 07:38 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `glowskin`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `qty` smallint UNSIGNED NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `product_id`, `qty`, `created_at`, `updated_at`) VALUES
(3, 3, 67, 1, '2026-09-24 04:14:32', '2026-09-24 04:14:32'),
(4, 3, 72, 1, '2026-09-24 04:15:30', '2026-09-24 04:15:30'),
(5, 3, 76, 1, '2026-09-24 04:15:37', '2026-09-24 04:15:37'),
(6, 1, 52, 1, '2026-09-24 04:22:21', '2026-09-24 04:22:21'),
(8, 1, 54, 1, '2026-09-24 04:22:24', '2026-09-24 04:22:24'),
(9, 1, 60, 1, '2026-09-24 04:22:28', '2026-09-24 04:22:28'),
(15, 4, 54, 2, '2026-10-05 07:28:35', '2026-10-05 07:28:44'),
(16, 4, 55, 1, '2026-10-05 07:29:00', '2026-10-05 07:29:00'),
(24, 6, 64, 1, '2026-10-05 11:13:59', '2026-10-05 11:13:59'),
(27, 7, 54, 1, '2026-10-05 17:52:49', '2026-10-05 17:52:49');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int UNSIGNED NOT NULL,
  `slug` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `sort_order` tinyint UNSIGNED DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `slug`, `name`, `icon`, `sort_order`, `created_at`) VALUES
(1, 'serum', 'Serum', 'fa-tint', 1, '2026-09-23 04:24:30'),
(2, 'moisturizer', 'Moisturizer', 'fa-droplet', 2, '2026-09-23 04:24:30'),
(3, 'cleanser', 'Cleanser', 'fa-soap', 3, '2026-09-23 04:24:30'),
(4, 'sunscreen', 'Sunscreen', 'fa-sun', 4, '2026-09-23 04:24:30'),
(5, 'toner', 'Toner', 'fa-flask', 5, '2026-09-23 04:24:30'),
(6, 'mask', 'Mask', 'fa-spa', 6, '2026-09-23 04:24:30'),
(7, 'eye-cream', 'Eye Cream', 'fa-eye', 7, '2026-09-23 04:24:30');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` bigint UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `email` varchar(150) NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `attempted_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `ip_address`, `email`, `success`, `attempted_at`) VALUES
(39, '::1', 'admin@fidea.com', 1, 1791222796);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `order_code` varchar(20) NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `subtotal` int UNSIGNED NOT NULL DEFAULT '0',
  `shipping_cost` int UNSIGNED NOT NULL DEFAULT '0',
  `discount` int UNSIGNED NOT NULL DEFAULT '0',
  `total` int UNSIGNED NOT NULL DEFAULT '0',
  `promo_code` varchar(50) DEFAULT NULL,
  `shipping_name` varchar(150) DEFAULT NULL,
  `shipping_phone` varchar(20) DEFAULT NULL,
  `shipping_address` text,
  `shipping_courier` varchar(50) DEFAULT NULL,
  `shipping_service` varchar(50) DEFAULT NULL,
  `shipping_estimate` varchar(50) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'transfer',
  `payment_proof` varchar(500) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `order_code`, `status`, `subtotal`, `shipping_cost`, `discount`, `total`, `promo_code`, `shipping_name`, `shipping_phone`, `shipping_address`, `shipping_courier`, `shipping_service`, `shipping_estimate`, `tracking_number`, `shipped_at`, `payment_method`, `payment_proof`, `notes`, `created_at`, `updated_at`) VALUES
(2, 4, 'GSE3ACE552', 'delivered', 614000, 8000, 0, 622000, NULL, 'Minmin', '4567890', 'sdfghjkl', 'J&T', 'Economy', '3-5 hari kerja', NULL, NULL, 'qris', NULL, 'cvbnmvbnjkl', '2026-10-05 05:05:02', '2026-10-05 16:32:10'),
(3, 4, 'GS95789656', 'delivered', 334000, 13000, 0, 347000, NULL, 'Minmin', '234567890', 'SDFGHJK', 'J&T', 'Regular', '2-3 hari kerja', NULL, NULL, 'cod', NULL, 'YUHIJKO', '2026-10-05 05:34:33', '2026-10-05 08:11:33'),
(4, 6, 'GSC9582273', 'shipped', 425000, 8000, 0, 433000, NULL, 'nini', '456789', 'dfghjk', 'J&T', 'Economy', '3-5 hari kerja', 'JNE1245', '2026-10-05 16:31:57', 'cod', NULL, 'fghj', '2026-10-05 10:11:56', '2026-10-05 16:31:57'),
(5, 6, 'GS4014D186', 'delivered', 185000, 13000, 0, 198000, NULL, 'nini', '456789', 'dfghjk', 'J&T', 'Regular', '2-3 hari kerja', NULL, NULL, 'cod', NULL, 'fghj', '2026-10-05 10:12:52', '2026-10-05 16:31:28'),
(6, 6, 'GS64664526', 'cancelled', 1450000, 8000, 20000, 1438000, 'NEWUSER640FB', 'nini', '456789', 'dfghjk', 'J&T', 'Economy', '3-5 hari kerja', NULL, NULL, 'cod', NULL, 'fghj', '2026-10-05 10:13:26', '2026-10-05 10:44:55'),
(7, 6, 'GSFCBDAD49', 'delivered', 315000, 8000, 20000, 303000, 'NEWUSER640FB', 'nini', '345678', 'sdfghjk', 'J&T', 'Economy', '3-5 hari kerja', NULL, NULL, 'transfer', 'uploads/payment_proofs/proof_7_1791197170.png', NULL, '2026-10-05 10:45:35', '2026-10-05 13:07:22'),
(8, 6, 'GS1A455410', 'delivered', 135000, 8000, 0, 143000, NULL, 'nini', '23456789', 'dfvgbhnm,', 'J&T', 'Economy', '3-5 hari kerja', NULL, NULL, 'qris', NULL, 'gvhjk', '2026-10-05 10:58:41', '2026-10-05 13:23:32'),
(9, 6, 'GS882A9519', 'delivered', 1450000, 8000, 0, 1458000, NULL, 'nini', '456789', 'fghjk', 'J&T', 'Economy', '3-5 hari kerja', NULL, NULL, 'transfer', NULL, 'fghj', '2026-10-05 11:11:52', '2026-10-05 13:07:29'),
(10, 6, 'GS4C9BE721', 'cancelled', 135000, 8000, 0, 143000, NULL, 'nini', '456789', 'fghjk', 'J&T', 'Economy', '3-5 hari kerja', NULL, NULL, 'qris', NULL, 'fghj', '2026-10-05 11:13:24', '2026-10-05 11:13:45'),
(11, 7, 'GSDEDB0B76', 'delivered', 185000, 8000, 20000, 173000, 'NEWUSER75570', 'sisi', '08956743556', 'Jl. Murai', 'J&T', 'Economy', '3-5 hari kerja', 'JNE123', '2026-10-05 16:30:24', 'cod', NULL, 'Berikan yang exp lama ya kak', '2026-10-05 14:21:49', '2026-10-05 16:31:00'),
(12, 7, 'GSED91D635', 'delivered', 168000, 8000, 0, 176000, NULL, 'sisi', '08956743556', 'Jl. Murai No. 1', 'J&T', 'Economy', '3-5 hari kerja', 'JNT001', '2026-10-05 14:32:26', 'transfer', 'uploads/payment_proofs/proof_12_1791210188.png', 'Berikan yang exp lama ya kak', '2026-10-05 14:22:54', '2026-10-05 16:25:23');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_brand` varchar(100) NOT NULL,
  `product_image` varchar(500) DEFAULT NULL,
  `qty` smallint UNSIGNED NOT NULL,
  `price_at_order` int UNSIGNED NOT NULL,
  `subtotal` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_brand`, `product_image`, `qty`, `price_at_order`, `subtotal`) VALUES
(3, 2, 51, 'Madagascar Centella Ampoule', 'Skin1004', 'https://images.soco.id/27bee983-e45f-4361-9fa3-2a5e91546249-image-0-1735036118157', 1, 189000, 189000),
(4, 2, 52, 'Effaclar Serum Ultra Concentrated', 'La Roche-Posay', 'https://beautypouch.pk/cdn/shop/files/yakqzxooqx3__27510.jpg?v=1694842694&width=1946', 1, 425000, 425000),
(5, 3, 53, 'All Day Fine Vitamin C 5% Serum', 'Jumiso', 'https://tse4.mm.bing.net/th/id/OIP.jgBN5n6rYOPZK3g9sTdl-wHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 1, 185000, 185000),
(6, 3, 54, 'AHA BHA PHA 30 Days Miracle Serum', 'Some By Mi', 'https://kbeauty.ca/cdn/shop/products/SOMEBYMIAHABHAPHA30DaysMiracleSerum.jpg?v=1710727916', 1, 149000, 149000),
(7, 4, 52, 'Effaclar Serum Ultra Concentrated', 'La Roche-Posay', 'https://beautypouch.pk/cdn/shop/files/yakqzxooqx3__27510.jpg?v=1694842694&width=1946', 1, 425000, 425000),
(8, 5, 53, 'All Day Fine Vitamin C 5% Serum', 'Jumiso', 'https://tse4.mm.bing.net/th/id/OIP.jgBN5n6rYOPZK3g9sTdl-wHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 1, 185000, 185000),
(9, 6, 55, 'Facial Treatment Essence', 'SK-II', 'https://medias.lookatme.com.ph/publishing/LOOKPH-50044446-side-zoom.jpg?version=1728382993', 1, 1450000, 1450000),
(10, 7, 60, 'Effaclar Micro-Exfoliating Toner', 'La Roche-Posay', 'https://tse1.mm.bing.net/th/id/OIP.D0GX0YEO0WPRhHnZFnkuXQHaGX?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 1, 315000, 315000),
(11, 8, 65, 'Green Tea Seed Hyaluronic Toner', 'Innisfree', 'https://i.pinimg.com/736x/78/5d/59/785d59633f56d8638f84b793d57859fb.jpg', 1, 135000, 135000),
(12, 9, 55, 'Facial Treatment Essence', 'SK-II', 'https://medias.lookatme.com.ph/publishing/LOOKPH-50044446-side-zoom.jpg?version=1728382993', 1, 1450000, 1450000),
(13, 10, 65, 'Green Tea Seed Hyaluronic Toner', 'Innisfree', 'https://i.pinimg.com/736x/78/5d/59/785d59633f56d8638f84b793d57859fb.jpg', 1, 135000, 135000),
(14, 11, 53, 'All Day Fine Vitamin C 5% Serum', 'Jumiso', 'https://tse4.mm.bing.net/th/id/OIP.jgBN5n6rYOPZK3g9sTdl-wHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 1, 185000, 185000),
(15, 12, 63, 'Dive-In Low Molecular Hyaluronic Acid Toner', 'Torriden', 'https://th.bing.com/th/id/R.70577faac89fa788b07def3d5f726f33?rik=sQ%2ff0CcE5sUaIw&riu=http%3a%2f%2fk-wonders.com%2fcdn%2fshop%2fproducts%2fTonerTorriden.jpg%3fv%3d1681573814&ehk=F4XExXTLvNriCNJpxEadnhBRNWq%2b5j8Im%2f0oDyLMrc8%3d&risl=&pid=ImgRaw&r=0', 1, 168000, 168000);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `category_slug` varchar(50) NOT NULL,
  `price` int UNSIGNED NOT NULL,
  `original_price` int UNSIGNED NOT NULL,
  `rating` decimal(2,1) DEFAULT '0.0',
  `reviews` int UNSIGNED DEFAULT '0',
  `badge` enum('new','hot','sale','bestseller') DEFAULT NULL,
  `description` text,
  `skin_type` varchar(255) DEFAULT NULL,
  `key_ingredients` varchar(255) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `stock` int UNSIGNED DEFAULT '100',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `brand`, `category_slug`, `price`, `original_price`, `rating`, `reviews`, `badge`, `description`, `skin_type`, `key_ingredients`, `image_url`, `stock`, `is_active`, `created_at`, `updated_at`) VALUES
(51, 'Madagascar Centella Ampoule', 'Skin1004', 'serum', 189000, 240000, 4.6, 5, 'bestseller', 'Ampoule dengan 100% centella asiatica extract dari Madagascar untuk menenangkan kulit meradang, mempercepat regenerasi, dan memperkuat skin barrier. Formula bebas alkohol dan pewangi.', 'Sensitif, Berjerawat, Kemerahan', 'Centella Asiatica Extract 100%, Madecassoside, Asiaticoside, Asiatic Acid', 'https://images.soco.id/27bee983-e45f-4361-9fa3-2a5e91546249-image-0-1735036118157', 99, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(52, 'Effaclar Serum Ultra Concentrated', 'La Roche-Posay', 'serum', 425000, 540000, 4.2, 5, 'hot', 'Serum anti-jerawat dengan LHA, BHA, dan Niacinamide untuk mengurangi jerawat, memperkecil pori, dan menyamarkan bekas jerawat. Dermatologically tested untuk kulit sensitif.', 'Berminyak, Berjerawat, Kombinasi', 'LHA 0.1%, Salicylic Acid 0.5%, Niacinamide, Zinc PCA', 'https://beautypouch.pk/cdn/shop/files/yakqzxooqx3__27510.jpg?v=1694842694&width=1946', 98, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(53, 'All Day Fine Vitamin C 5% Serum', 'Jumiso', 'serum', 185000, 235000, 4.4, 5, 'new', 'Serum vitamin C stabil dengan formula ringan yang mencerahkan kulit, meratakan warna kulit, dan melindungi dari kerusakan akibat radikal bebas. Cocok untuk pemakaian pagi hari.', 'Kusam, Hiperpigmentasi, Semua jenis kulit', 'Ascorbic Acid 5%, Niacinamide, Panthenol, Allantoin', 'https://tse4.mm.bing.net/th/id/OIP.jgBN5n6rYOPZK3g9sTdl-wHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 97, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(54, 'AHA BHA PHA 30 Days Miracle Serum', 'Some By Mi', 'serum', 149000, 190000, 4.4, 5, 'bestseller', 'Serum eksfoliasi triple acid dengan AHA, BHA, dan PHA untuk mengangkat sel kulit mati, membersihkan pori tersumbat, dan mencerahkan kulit secara menyeluruh dalam 30 hari.', 'Berminyak, Berjerawat, Kombinasi', 'AHA (Glycolic Acid 0.6%), BHA (Salicylic Acid 0.3%), PHA (Gluconolactone), Tea Tree', 'https://kbeauty.ca/cdn/shop/products/SOMEBYMIAHABHAPHA30DaysMiracleSerum.jpg?v=1710727916', 99, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(55, 'Facial Treatment Essence', 'SK-II', 'serum', 1450000, 1750000, 4.4, 5, 'bestseller', 'Essence ikonik SK-II dengan lebih dari 90% Pitera ÔÇö hasil fermentasi ragi yang kaya nutrisi untuk mempercepat pembaruan sel kulit. Kulit tampak lebih cerah, halus, dan bercahaya dalam 4 minggu.', 'Semua jenis kulit, Aging, Kusam', 'Pitera (Galactomyces Ferment Filtrate) 90%+, Saccharomycopsis Ferment Filtrate', 'https://medias.lookatme.com.ph/publishing/LOOKPH-50044446-side-zoom.jpg?version=1728382993', 49, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(56, 'Niacinamide 10 TXA 4', 'Anua', 'serum', 198000, 250000, 4.2, 5, 'hot', 'Serum ringan berbasis air yang difokuskan untuk membantu menyamarkan noda hitam, bekas jerawat, kulit kusam, dan warna kulit yang tidak merata. Teksturnya ringan dan tidak terasa terlalu berminyak.', 'Kulit Normal, Kulit Kombinasi, Kulit Berminyak', 'Water, Glycerin, Niacinamide (10%), Tranexamic Acid (4%), Arbutin (2%), multiple plant extracts, ceramides, hyaluronic acid variants, and additional skin‑conditioning agents.', 'https://lilabeauty.com.au/cdn/shop/files/anua_txa_renew.jpg?v=1749528261', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(57, 'Dive-In Hyaluronic Acid Serum', 'Torriden', 'serum', 175000, 220000, 4.4, 5, 'bestseller', 'Serum hyaluronic acid dengan 5 jenis HA berbeda ukuran molekul untuk hidrasi dari lapisan terdalam hingga permukaan kulit. Memberikan efek plumping dan bouncy pada kulit.', 'Kering, Dehidrasi, Semua jenis kulit', 'Micro Hyaluronic Acid 500ppm, Sodium Hyaluronate, Panthenol, Allantoin', 'https://tse1.mm.bing.net/th/id/OIP.f04Iwb-Qi6qdl8V4V_V7GwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(58, 'Advanced Snail 96 Mucin Power Essence', 'COSRX', 'serum', 219000, 275000, 4.4, 5, 'bestseller', 'Essence dengan 96% snail secretion filtrate yang membantu regenerasi kulit, memudarkan bekas luka dan jerawat, serta memberikan hidrasi intensif. Tekstur lembut seperti gel ringan.', 'Semua jenis kulit, Bekas Jerawat', 'Snail Secretion Filtrate 96%, Sodium Hyaluronate, Allantoin', 'https://tse3.mm.bing.net/th/id/OIP.knRBl6XROY5wiIuTKkri6wHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(59, 'Madagascar Centella Tone Brightening Boosting', 'Skin1004', 'toner', 165000, 210000, 4.4, 5, 'hot', 'Toner yang difokuskan untuk mencerahkan kulit, membantu menyamarkan noda/bekas jerawat, meratakan warna kulit, sekaligus memberikan hidrasi. Teksturnya ringan dan dapat digunakan sebagai langkah persiapan sebelum serum atau moisturizer.', 'Kombinasi, Berminyak, Normal', 'Niacinamide, Tranexamic Acid, Madecassoside, Centella Asiatica, 3-O-Ethyl Ascorbic Acid', 'https://cdn.myikas.com/images/a45d3816-52bd-4ec3-a97e-1ace3e8eaf5c/ea39e744-aa5f-4f4b-991d-bbbc1a17e9cf/3840/skin1004-madagascar-centella-tone-brightening-boosting-toner-210ml-kutulu-1.webp', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(60, 'Effaclar Micro-Exfoliating Toner', 'La Roche-Posay', 'toner', 315000, 395000, 4.4, 5, 'new', 'Toner eksfoliasi dengan LHA untuk membersihkan pori dari dalam, mengontrol produksi minyak, dan menghaluskan tekstur kulit. Diformulasikan khusus untuk kulit berjerawat dan sensitif.', 'Berminyak, Berjerawat, Sensitif', 'LHA, Glycolic Acid, Salicylic Acid, Niacinamide', 'https://tse1.mm.bing.net/th/id/OIP.D0GX0YEO0WPRhHnZFnkuXQHaGX?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 99, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(61, 'Yes, I Am Toner AHA 5%', 'Jumiso', 'toner', 155000, 198000, 4.6, 5, 'bestseller', 'Toner eksfoliasi lembut dengan AHA 5% yang membantu memperbaiki tekstur kulit, mencerahkan, dan meningkatkan penyerapan skincare berikutnya. Formula menenangkan dengan panthenol.', 'Normal, Kombinasi, Kusam', 'AHA 5%, Glycolic Acid, Lactic Acid, Panthenol, Allantoin', 'https://www.aziatika.bg/images/products/large/eksfolirasht-tonik-s-aha-kiselina-1.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(62, 'Heartleaf 77% Soothing Toner', 'Anua', 'toner', 178000, 225000, 4.2, 5, 'bestseller', 'Toner dengan 77% heartleaf (Houttuynia Cordata) extract yang terkenal dengan kemampuannya menenangkan kulit meradang, mengontrol minyak, dan memperkuat skin barrier secara alami.', 'Berminyak, Sensitif, Berjerawat', 'Houttuynia Cordata Extract 77%, Niacinamide, Hyaluronic Acid, Betaine', 'https://tse4.mm.bing.net/th/id/OIP.tMS7SIluUIt3Gnce2pZa-QHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(63, 'Dive-In Low Molecular Hyaluronic Acid Toner', 'Torriden', 'toner', 168000, 212000, 4.4, 5, 'hot', 'Toner yang berfokus pada hidrasi, membantu menjaga kelembapan kulit, dan membuat kulit terasa lebih plump serta lembut.', 'Semua jenis kulit, terutama kulit kering, dehidrasi, sensitif, dan kombinasi.', 'Low Molecular Hyaluronic Acid, Sodium Hyaluronate, Panthenol, Allantoin, Betaine, Trehalose, Centella Asiatica Extract.', 'https://th.bing.com/th/id/R.70577faac89fa788b07def3d5f726f33?rik=sQ%2ff0CcE5sUaIw&riu=http%3a%2f%2fk-wonders.com%2fcdn%2fshop%2fproducts%2fTonerTorriden.jpg%3fv%3d1681573814&ehk=F4XExXTLvNriCNJpxEadnhBRNWq%2b5j8Im%2f0oDyLMrc8%3d&risl=&pid=ImgRaw&r=0', 99, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(64, 'One Step Original Clear Pad', 'COSRX', 'toner', 189000, 238000, 4.4, 5, 'bestseller', 'Exfoliating pad dua sisi dengan willow bark water dan betaine salicylate untuk membersihkan pori, mengangkat sel kulit mati, dan menyeimbangkan produksi sebum. 70 pad per botol.', 'Berminyak, Berjerawat, Kombinasi', 'Willow Bark Water 70%, Betaine Salicylate 0.1%, Niacinamide, Aloe Vera', 'https://cdn11.bigcommerce.com/s-7p5jn6i1wf/images/stencil/1280x1280/products/1851/4217/cosrx-one-step-original-clear-pad__81306.1724829040.jpg?c=1', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(65, 'Green Tea Seed Hyaluronic Toner', 'Innisfree', 'toner', 135000, 172000, 4.4, 5, 'sale', 'Toner dengan green tea dari Pulau Jeju yang kaya antioksidan dan hyaluronic acid untuk menghidrasi dan menyeimbangkan kulit. Cocok untuk pemakaian pagi dan malam.', 'Normal, Kombinasi, Berminyak', 'Jeju Green Tea Water 73%, Hyaluronic Acid, Green Tea Extract, Beta-Glucan', 'https://i.pinimg.com/736x/78/5d/59/785d59633f56d8638f84b793d57859fb.jpg', 99, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(66, 'Madagascar Centella Hyalu-Cica Moisture Cream', 'Skin1004', 'moisturizer', 195000, 248000, 4.2, 5, 'bestseller', 'Moisturizer yang membantu menghidrasi, menenangkan, dan menjaga skin barrier. Teksturnya ringan dan membantu menjaga kulit tetap lembap tanpa terasa terlalu berat.', 'kulit normal, kombinasi, berminyak, kering, dehidrasi, dan sensitif.', 'Centella Asiatica Extract, Hyaluronic Acid, Ceramide NP, Panthenol, Glycerin, Betaine, Sodium Hyaluronate, Allantoin.', 'https://tse2.mm.bing.net/th/id/OIP.lXptyus7Y9E6vl2gglmssgHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(67, 'Toleriane Double Repair Face Moisturizer', 'La Roche-Posay', 'moisturizer', 385000, 480000, 4.4, 5, 'bestseller', 'Moisturizer medis-grade dengan ceramide dan niacinamide untuk memulihkan dan memperkuat skin barrier kulit sensitif. Diformulasikan dengan Prebiotic Thermal Water untuk keseimbangan mikrobioma.', 'Sensitif, Kering, Barrier Rusak', 'Ceramide 3, Niacinamide, Glycerin, La Roche-Posay Thermal Spring Water', 'https://down-th.img.susercontent.com/file/sg-11134202-8224x-mhhhw25t7ocg5b', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(68, 'Waterfull Hyaluronic Acid Cream', 'Jumiso', 'moisturizer', 168000, 215000, 4.4, 5, 'new', 'Moisturizer yang membantu memberikan hidrasi intensif, menjaga kelembapan kulit, dan membuat kulit terasa lebih lembut serta kenyal.', 'Kulit kering, dehidrasi, normal, kombinasi, dan dapat digunakan oleh kulit sensitif.', 'Hyaluronic Acid, Sodium Hyaluronate, Glycerin, Panthenol, Betaine, Trehalose, Allantoin.', 'https://kbeautyarabia.com/cdn/shop/files/JumisoWaterfullHyaluronicCream4.png?v=1702964594&width=1200', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(69, 'Skinpower Re-New Cream', 'SK-II', 'moisturizer', 1250000, 1550000, 4.4, 5, 'hot', 'Krim pelembap yang membantu menghidrasi, menjaga elastisitas kulit, menghaluskan tekstur, dan membuat kulit tampak lebih kenyal.', 'Kulit normal, kering, kombinasi, dan kulit yang mulai menunjukkan tanda penuaan.', 'PITERA™, Niacinamide, Glycerin, Panthenol, Squalane, Peptide, Soybean Seed Extract.', 'https://japanesetaste.com.au/cdn/shop/files/SK-II-Skin-Power-Re-New-Airy-Cream-Firming-Face-Moisturizer-80g-1-2026-04-01T02_12_17.327Z.png?v=1775010002&width=1024', 30, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(70, 'Heartleaf 70% Intense Calming Cream', 'Anua', 'moisturizer', 215000, 270000, 4.4, 5, 'bestseller', 'Moisturizer yang membantu menenangkan kulit, mengurangi kemerahan, memberikan hidrasi, dan memperkuat skin barrier.', 'Kulit sensitif, kering, kombinasi, normal, dan acne-prone.', 'Heartleaf Extract 70%, Glycerin, Panthenol, Ceramide NP, Squalane, Betaine, Allantoin, Sodium Hyaluronate.', 'https://skinkorea.ae/cdn/shop/files/anua-heartleaf-moisture-cream-50ml-494378.jpg?v=1726082342&width=533', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(71, 'Dewy Glow Jelly Cream', 'Innisfree', 'moisturizer', 229000, 290000, 4.6, 5, 'hot', 'Moisturizer bertekstur gel ringan yang membantu menghidrasi, mencerahkan, menenangkan, dan memberikan tampilan kulit dewy/glowing.', 'Normal, kombinasi, berminyak.', 'Glycerin, Propanediol, Niacinamide, Betaine, Prunus Yedoensis Leaf Extract (Cherry Blossom), Tocopherol, 1,2-Hexanediol, Fragrance.', 'https://ponly.cachefly.net/wp-content/uploads/Best-Korean-Moisturizer-for-Glow.webp', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(72, 'Balanceful Cream', 'Some By Mi', 'moisturizer', 165000, 210000, 4.2, 5, 'new', 'Krim dengan centella asiatica dan tea tree oil untuk menyeimbangkan kulit berminyak berjerawat. Mengontrol sebum berlebih sambil tetap memberikan hidrasi yang cukup.', 'Berminyak, Berjerawat, Kombinasi', 'Centella Asiatica, Tea Tree Oil, Niacinamide, Salicylic Acid 0.3%', 'https://tse4.mm.bing.net/th/id/OIP.UGPOxk-c6uw9RFEfyyuNTAHaJt?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(73, 'YSL Tinted Moisturizer', 'YSL Beauty', 'moisturizer', 1350000, 1650000, 4.4, 5, 'hot', 'Tinted moisturizer yang memberikan kelembapan sekaligus sedikit coverage dan efek kulit lebih merata/natural, sehingga bisa digunakan sebagai makeup ringan.', 'Semua jenis kulit', 'Hyaluronic Acid, Glycerin, Niacinamide, Vitamin E, Jojoba Oil, Shea Butter.', 'https://i1.perfumesclub.com/grande/101799.jpg', 30, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(74, 'Madagascar Centella Air-Fit Suncream Plus SPF50+ PA++++:', 'Skin1004', 'sunscreen', 155000, 198000, 4.4, 5, 'bestseller', 'Sunscreen dengan tekstur ringan yang membantu melindungi kulit dari sinar UVA/UVB, sekaligus memberikan efek menenangkan dan melembapkan tanpa terasa terlalu berat.', 'Semua jenis kulit, terutama normal, kombinasi, berminyak, sensitif, dan acne-prone.', 'Centella Asiatica Extract, Niacinamide, Zinc Oxide, Titanium Dioxide, Glycerin, Sodium Hyaluronate, Tocopherol.', 'https://www.medoget.com/cdn/shop/files/skin1004-sun-50ml-centella-air-fit-suncream-plus-spf50-pa-38409094267126_1440x_4c3107a7-a47e-40ac-865b-3338e18ef403.webp?v=1722425778&width=1440', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(75, 'Anthelios UVMune 400 Invisible Fluid SPF 50+', 'La Roche-Posay', 'sunscreen', 389000, 490000, 4.4, 5, 'bestseller', 'Sunscreen dengan teknologi UV-Mune 400 terbaru yang memblokir sinar UVA ultra-panjang. Tekstur fluid ultra-ringan tanpa white cast, cocok untuk kulit sensitif. Direkomendasikan dermatologis.', 'Sensitif, Semua jenis kulit', 'Mexoryl 400, Mexoryl XL, Tinosorb S, SPF 50+ PA++++', 'https://www.eshaistic.pk/wp-content/uploads/2025/11/la-roche-posay-anthelios-uvmune-400-spf-50-ultimate-protection-50ml.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(76, 'Awe·Sun Airy-Fit Daily Sunscreen', 'Jumiso', 'sunscreen', 145000, 185000, 4.2, 5, 'new', 'Sunscreen harian dengan tekstur ringan dan nyaman yang membantu melindungi kulit dari UVA/UVB sekaligus menjaga kelembapan kulit tanpa rasa berat.', 'Semua jenis kulit', 'Niacinamide, Panthenol, Glycerin, Adenosine, Tocopherol, Centella Asiatica Extract, Hyaluronic Acid.', 'https://d2j6dbq0eux0bg.cloudfront.net/images/25758193/4115647344.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(77, 'Aqua Calming Sunscreen', 'Some By Mi', 'sunscreen', 138000, 175000, 4.4, 5, 'hot', 'Sunscreen ringan yang membantu melindungi kulit dari sinar UVA/UVB, memberikan hidrasi, dan membantu menenangkan kulit. Cocok untuk penggunaan sehari-hari.', 'Semua jenis kulit', 'Centella Asiatica, Hyaluronic Acid, Niacinamide, Panthenol, Glycerin, Tocopherol.', 'https://bearel.fi/wp-content/uploads/2023/12/Bearel-tuotekuvat-verkkokauppaan88.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(78, 'Airy Sun Cream', 'Anua', 'sunscreen', 178000, 225000, 4.4, 5, 'bestseller', 'Sunscreen dengan tekstur ringan yang membantu melindungi kulit dari sinar UVA/UVB, menjaga kelembapan, dan memberikan hasil akhir yang nyaman untuk pemakaian sehari-hari.', 'Semua jenis kulit', 'Niacinamide, Panthenol, Hyaluronic Acid, Centella Asiatica Extract, Glycerin, Tocopherol, Ceramide NP.', 'https://mapetitecoree.com/cdn/shop/files/ANUA-Cica-Heartleaf-Airy-Sun-Cream-SPF50-PA-50ml-Ma-Petite-Coree.png?v=1747486494&width=1000', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(79, 'Dive-In Soothing Sun Stick', 'Torriden', 'sunscreen', 168000, 213000, 4.4, 5, 'hot', 'Sunscreen berbentuk stick yang praktis untuk perlindungan UVA/UVB, menjaga kelembapan, dan membantu menenangkan kulit. Mudah digunakan untuk reapply sunscreen sepanjang hari.', 'Semua jenis kulit', 'Hyaluronic Acid, Centella Asiatica Extract, Panthenol, Niacinamide, Tocopherol, Adenosine.', 'https://www.pinkland.co.nz/wp-content/uploads/2025/06/tr045.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(80, 'Aloe Soothing Sun Cream', 'COSRX', 'sunscreen', 185000, 235000, 4.4, 5, 'new', 'Sunscreen dengan tekstur cream yang membantu melindungi kulit dari sinar UVA/UVB, melembapkan, dan memberikan efek menenangkan pada kulit.', 'Normal, kering', 'Aloe Arborescens Leaf Extract, Aloe Barbadensis Leaf Extract, Niacinamide, Tocopheryl Acetate, Sodium Hyaluronate, Glycerin, Vitamin E.', 'https://kbeautynotes.com/wp-content/uploads/2023/03/COSRX-Aloe-Soothing-Sun-Cream-review-1-1-768x1024.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(81, 'Daily UV Defense Sunscreen SPF 36', 'Innisfree', 'sunscreen', 125000, 160000, 4.6, 5, 'bestseller', 'Sunscreen ringan sehari-hari dengan green tea extract dari Jeju untuk perlindungan UV plus antioksidan. Tekstur lightweight yang nyaman dipakai sehari-hari di bawah makeup.', 'Normal, Kombinasi, Semua jenis kulit', 'Jeju Green Tea, SPF 36 PA+++, Niacinamide, Vitamin E', 'https://phorcys-static.ewg.org/image/contents/652930/medium.png?1680287576\r\n', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(82, 'Hyalu-Cica Gentle Cleansing Milk', 'Skin1004', 'cleanser', 135000, 172000, 4.2, 5, 'bestseller', 'Sabun wajah berbusa lembut dengan hyaluronic acid dan centella asiatica yang membersihkan kotoran dan minyak tanpa menghilangkan kelembapan alami kulit. pH balanced 5.5.', 'Sensitif, Kering, Normal', 'Centella Asiatica, Hyaluronic Acid, Panthenol, Amino Acid Surfactant', 'https://static.ksisters.com/public/skus/l/a91a6ebe5ceac9db4e134dc4a7ebd2cc_744qq1i_d8e4cbd9d2d1df.webp', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(83, 'Toleriane Hydrating Gentle Cleanser', 'La Roche-Posay', 'cleanser', 278000, 350000, 4.4, 5, 'bestseller', 'Pembersih wajah ultra-lembut tanpa busa untuk kulit sensitif dan kering. Mengandung ceramide untuk menjaga skin barrier sambil membersihkan kotoran dan makeup secara efektif.', 'Sensitif, Kering, Barrier Rusak', 'Ceramide, Niacinamide, Glycerin, La Roche-Posay Thermal Spring Water', 'https://images-na.ssl-images-amazon.com/images/I/61E45LOdhWL.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(84, 'Pore Purufying Salicylic Acid Foam Cleanser', 'Jumiso', 'cleanser', 115000, 148000, 4.4, 5, 'hot', 'Pembersih wajah berbusa dengan salicylic acid dan niacinamide untuk membersihkan pori secara mendalam, mengontrol minyak, dan mencerahkan kulit. Self-foaming untuk busa yang melimpah.', 'Berminyak, Berjerawat, Pori Besar', 'Salicylic Acid, Niacinamide, Green Tea Extract, Amino Acid', 'https://theonionstores.com/cdn/shop/files/S4_f13aea14-315c-4c22-8c13-9833918782b4.jpg?v=1714464096&width=1946', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(85, 'Heartleaf Cleansing Oil', 'Anua', 'cleanser', 198000, 250000, 4.4, 5, 'bestseller', 'Cleansing oil dengan heartleaf extract untuk membersihkan makeup, sunscreen waterproof, dan kotoran secara menyeluruh. Tidak meninggalkan rasa berminyak dan tidak menyumbat pori.', 'Semua jenis kulit, Pori Besar', 'Houttuynia Cordata Extract 77%, Squalane, Jojoba Oil, Heartleaf Water', 'https://anua.com/cdn/shop/files/anua-us-cleanser-200ml-heartleaf-pore-control-cleansing-oil-1161173148.jpg?v=1746610775&width=2000', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(86, 'Low pH Good Morning Gel Cleanser', 'COSRX', 'cleanser', 195000, 248000, 4.2, 5, 'new', 'Facial cleanser dengan pH rendah yang membantu membersihkan kotoran, minyak, dan sisa skincare/makeup ringan tanpa membuat kulit terasa terlalu kering. Cocok untuk penggunaan sehari-hari.', 'Normal, kombinasi, berminyak, dan acne-prone.', 'Tea Tree Oil, Betaine Salicylate, Saccharomyces Ferment, Citric Acid, Allantoin, Sodium Methyl Cocoyl Taurate.', 'https://darbeauty.com/cdn/shop/products/CosrxLowpHGoodMorningGelCleanser-8809416470511-DarBeauty-02.jpg?v=1674547147&width=1080', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(87, 'Jeju Volcanic Pore Cleansing Foam', 'Innisfree', 'cleanser', 118000, 152000, 4.4, 5, 'bestseller', 'Sabun wajah ikonik Innisfree dengan volcanic ash dari Pulau Jeju untuk menyerap minyak berlebih, membersihkan pori tersumbat, dan memberikan kulit bersih matte.', 'Berminyak, Pori Besar, Kombinasi', 'Jeju Volcanic Ash, Salicylic Acid, Green Tea, Kaolin Clay', 'https://tse1.mm.bing.net/th/id/OIP.IabwsUSTvEKHt6pbNiupOAHaIV?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(88, 'AHA BHA PHA 30 Days Miracle Acne Clear Foam:', 'Some By Mi', 'cleanser', 95000, 122000, 4.4, 5, 'hot', 'Facial wash yang membantu membersihkan minyak dan kotoran, mengangkat sel kulit mati, serta membantu mengatasi kulit berjerawat dan komedo. Mengandung kombinasi AHA, BHA, dan PHA untuk eksfoliasi.', 'Terutama berminyak, kombinasi, acne-prone, dan kulit dengan komedo.', 'AHA, BHA, PHA, Tea Tree Leaf Water, Centella Asiatica, Witch Hazel, Papaya Extract, Lemon Extract.', 'https://down-id.img.susercontent.com/file/id-11134207-7r990-llbi7p73pqcre0', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(89, 'Madagascar Centella Tone Brightening Glow Mask', 'Skin1004', 'mask', 25000, 35000, 4.4, 5, 'bestseller', 'Masker wajah yang membantu mencerahkan kulit kusam, meratakan warna kulit, memberikan hidrasi, dan membantu menyamarkan tampilan noda hitam/bekas jerawat.', 'Semua jenis kulit', 'Centella Asiatica Extract, Niacinamide, Tranexamic Acid, 3-O-Ethyl Ascorbic Acid, Madecassoside, Glycerin, Panthenol, Hyaluronic Acid.', 'https://seoulea.com/cdn/shop/files/SKIN1004_Tone_Brightening_Glow_Mask1.webp?v=1774834247&width=1000', 200, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(90, 'Cicaplast B5 Soothing Repairing Mask:', 'La Roche-Posay', 'mask', 285000, 360000, 4.4, 5, 'new', 'Masker untuk membantu menenangkan, melembapkan, dan memulihkan skin barrier terutama saat kulit terasa kering, sensitif, atau tidak nyaman.', 'Semua jenis kulit, terutama kering, sensitif, iritasi, dan skin barrier yang sedang lemah.', 'Panthenol (Vitamin B5), Madecassoside, Glycerin, Shea Butter, Thermal Spring Water, Sodium Hyaluronate, Dimethicone.', 'https://www.lifepharmacy.co.nz/cdn/shop/files/gxh_20011858-1.jpg?v=1724975181', 80, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(91, 'Yuja Niacin 30 Days Brightening Sleeping Mask', 'Some By Mi', 'mask', 185000, 235000, 4.6, 5, 'bestseller', 'Sleeping mask dengan yuzu extract kaya vitamin C dan niacinamide untuk mencerahkan kulit kusam selama tidur. Pemakaian rutin 30 hari memberikan kulit lebih cerah dan merata.', 'Kusam, Hiperpigmentasi, Normal', 'Yuzu Extract, Niacinamide 2%, Vitamin C, Adenosine', 'https://shibushi.pl/hpeciai/b6e60a1a42c1d9b09e93c9ede3f601ed/pol_pl_Rozjasniajaca-maska-na-noc-Yuja-Niacin-30-Days-Miracle-Brightening-Sleeping-Mask-SOME-BY-MI-949_2.png', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(92, 'Super Volcanic Pore Clay Mask', 'Innisfree', 'mask', 178000, 228000, 4.2, 5, 'hot', 'Clay mask yang membantu menyerap minyak berlebih, membersihkan pori-pori, mengangkat sel kulit mati, dan membantu mengurangi tampilan komedo. Cocok untuk kulit yang terasa berminyak dan pori-pori terlihat besar.', 'Terutama berminyak, kombinasi, dan acne-prone.', 'Jeju Volcanic Cluster, AHA, Glycerin, Bentonite, Kaolin, Walnut Shell Powder.', 'https://m.media-amazon.com/images/I/71OAKiRewkL._SL1500_.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(93, 'Heartleaf + Ceramide Cream Mask Night Solution', 'Anua', 'mask', 115000, 148000, 4.4, 5, 'sale', 'Sheet mask berbahan cream yang membantu melembapkan, menenangkan kulit, dan mendukung skin barrier, terutama saat kulit terasa kering atau sensitif.', 'Kulit kering, normal, kombinasi, sensitif, dan kulit dengan skin barrier yang membutuhkan kelembapan.', 'Glycerin, Panthenol, Shea Butter, Phytosphingosine, Ceramide NP, Heartleaf Extract, Sodium Hyaluronate, Dipotassium Glycyrrhizate, Tocopherol.', 'https://allaboutskindoha.com/cdn/shop/files/Anua_Heartleaf_CeramideCreamMaskNightSolution25ml1sheet_allaboutskindoha_skincare_qatar_beauty_cosmetics_trending_tiktok_snapchat_facebook_instagram_Perfume_reels_hightlights_follower_ccd224ae-c5cf-4618-8754-015c0997d798.webp?v=1752506790&width=1946', 150, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(94, 'Regenerating Face Mask', 'YSL', 'mask', 195000, 248000, 4.4, 5, 'new', 'Masker wajah bertekstur krim yang membantu menutrisi, menghidrasi, menghaluskan, mengencangkan, dan membuat kulit tampak lebih plump serta glowing. Mengandung ekstrak saffron sebagai salah satu bahan utama.', 'Semua jenis kulit', 'Crocus Sativus Flower Extract, Glycerin, Shea Butter, Argan Oil, Panthenol, Ceramide NP, Adenosine, Tocopherol, Haematococcus Pluvialis Extract, Dimethicone, Soybean Oil, Sodium Hyaluronate.', 'https://www.yslbeauty.sa/on/demandware.static/-/Sites-ysl-master-catalog/default/dw0c0baa6f/Skincare/Yves-Saint-Laurent-Mask-Mascara-Or-Rouge-x1-15g-000-4935421744256-Front.jpg', 100, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(95, 'Hyalu-Cica Eye Cream', 'Skin1004', 'eye-cream', 189000, 240000, 4.4, 5, 'bestseller', 'Eye cream dengan centella asiatica dan hyaluronic acid untuk melembapkan, mengurangi lingkaran hitam, dan menyamarkan garis halus di area mata. Tekstur ringan yang tidak terasa berat.', 'Semua jenis kulit, Mature', 'Centella Asiatica Water, Sodium Hyaluronate, Caffeine, Peptide Complex', 'https://i.pinimg.com/736x/96/77/c5/9677c508a886aaa674c74c57bf2b308f.jpg', 80, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(96, 'Redermic Retinol Eye Cream', 'La Roche-Posay', 'eye-cream', 445000, 560000, 4.2, 5, 'hot', 'Eye cream dengan retinol dan hyaluronic acid untuk mengurangi kerutan halus, lingkaran hitam, dan kantung mata. Diformulasikan untuk kulit sensitif di area mata yang paling halus.', 'Mature, Sensitif, Aging', 'Retinol, Hyaluronic Acid, Caffeine, Glycerin', 'https://i5.walmartimages.com/asr/019449cb-189e-483c-801b-ca3b3ecc22d5.6682e9168500f388bb6e1c5178ab2596.jpeg', 50, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(97, 'OR Rouge Youth Liberating Eye Serum', 'YSL Beauty', 'eye-cream', 1850000, 2250000, 4.4, 5, 'hot', 'Eye serum premium YSL dengan Saffron Flower Extract yang bekerja pada level sel untuk mengurangi tanda penuaan di area mata. Formula mewah dalam kemasan ikonik berwarna merah.', 'Mature, Aging, Semua jenis kulit', 'Saffron Flower Extract, Revitalizing Complex, Hyaluronic Acid, Vitamin E', 'https://down-id.img.susercontent.com/file/983267ec4e098b359b490eacdfefc950', 20, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(98, 'Advanced Snail Peptide Eye Cream', 'COSRX', 'eye-cream', 235000, 295000, 4.4, 5, 'bestseller', 'Eye cream dengan snail secretion filtrate dan peptide untuk regenerasi kulit area mata, memudarkan lingkaran hitam, mengurangi bengkak, dan menghaluskan crow\'s feet secara efektif.', 'Semua jenis kulit, Mature', 'Snail Secretion Filtrate 70.8%, Peptide Complex, Sodium Hyaluronate, Panthenol', 'https://m.media-amazon.com/images/I/313Sh9mDa5L._AC_.jpg', 80, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(99, 'Skinpower Eye Cream', 'SK-II', 'eye-cream', 1150000, 1400000, 4.4, 5, 'bestseller', 'Eye cream premium SK-II dengan Wild Orchid Extract dan Pitera untuk mengurangi lingkaran hitam, mencerahkan area mata, dan memberikan efek lifting pada kelopak mata yang kendur.', 'Mature, Aging, Semua jenis kulit', 'Pitera, Wild Orchid Extract, Retinyl Palmitate, Sodium Hyaluronate', 'https://img.kingpowerclick.com/cdn-cgi/image/format=auto/kingpower-com/image/upload/w_640,h_640/v1662611241/prod/928107-L2.jpg', 30, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06'),
(100, 'Niacinamide 5+ Dark Circle Correcting Eye Cream', 'Jumiso', 'eye-cream', 195000, 248000, 4.4, 5, 'new', 'Eye cream yang difokuskan untuk membantu mencerahkan area bawah mata, mengurangi tampilan dark circle, membantu mengurangi puffiness, serta membuat area mata tampak lebih halus dan kencang. Mengandung Niacinamide 5% dan Caffeine 2%.', 'Semua jenis kulit, Aging', 'Semua jenis kulit', 'https://elloxy.mk/wp-content/uploads/2026/07/1810.jpg', 80, 1, '2026-09-23 07:29:48', '2026-10-05 17:48:06');

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_reviews`
--

INSERT INTO `product_reviews` (`id`, `user_id`, `product_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 51, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-10-01 17:48:06'),
(2, 2, 51, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-09-03 17:48:06'),
(3, 3, 51, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-09-17 17:48:06'),
(4, 4, 51, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-07-10 17:48:06'),
(5, 5, 51, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-09-23 17:48:06'),
(6, 1, 52, 5, 'Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!', '2026-08-11 17:48:06'),
(7, 2, 52, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-10-01 17:48:06'),
(8, 3, 52, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-09-07 17:48:06'),
(9, 4, 52, 3, 'Teksturnya agak berat untuk kulit berminyak, tapi tetap aman dipakai.', '2026-08-01 17:48:06'),
(10, 5, 52, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-25 17:48:06'),
(11, 1, 53, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-07-05 17:48:06'),
(12, 2, 53, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-08-12 17:48:06'),
(13, 3, 53, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-08-08 17:48:06'),
(14, 4, 53, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-06-23 17:48:06'),
(15, 5, 53, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-06-29 17:48:06'),
(16, 1, 54, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-07-07 17:48:06'),
(17, 2, 54, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-08-22 17:48:06'),
(18, 3, 54, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-09-15 17:48:06'),
(19, 4, 54, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-06-29 17:48:06'),
(20, 5, 54, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-09-21 17:48:06'),
(21, 1, 55, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-08-17 17:48:06'),
(22, 2, 55, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-08-20 17:48:06'),
(23, 3, 55, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-07-19 17:48:06'),
(24, 4, 55, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-06-23 17:48:06'),
(25, 5, 55, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-03 17:48:06'),
(26, 1, 56, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-07-28 17:48:06'),
(27, 2, 56, 3, 'Produknya oke, tapi hasilnya belum terlalu kelihatan di minggu pertama.', '2026-06-08 17:48:06'),
(28, 3, 56, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-09-24 17:48:06'),
(29, 4, 56, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-08-28 17:48:06'),
(30, 5, 56, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-07-23 17:48:06'),
(31, 1, 57, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-07-06 17:48:06'),
(32, 2, 57, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-09-29 17:48:06'),
(33, 3, 57, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-06-28 17:48:06'),
(34, 4, 57, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-09-24 17:48:06'),
(35, 5, 57, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-06-16 17:48:06'),
(36, 1, 58, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-08-17 17:48:06'),
(37, 2, 58, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-08-07 17:48:06'),
(38, 3, 58, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-09-14 17:48:06'),
(39, 4, 58, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-08-20 17:48:06'),
(40, 5, 58, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-07-11 17:48:06'),
(41, 1, 59, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-07-07 17:48:06'),
(42, 2, 59, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-07-19 17:48:06'),
(43, 3, 59, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-07-28 17:48:06'),
(44, 4, 59, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-09-14 17:48:06'),
(45, 5, 59, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-08-17 17:48:06'),
(46, 1, 60, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-06-08 17:48:06'),
(47, 2, 60, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-07-09 17:48:06'),
(48, 3, 60, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-06-19 17:48:06'),
(49, 4, 60, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-09-05 17:48:06'),
(50, 5, 60, 3, 'Produknya oke, tapi hasilnya belum terlalu kelihatan di minggu pertama.', '2026-06-23 17:48:06'),
(51, 1, 61, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-08-14 17:48:06'),
(52, 2, 61, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-09-26 17:48:06'),
(53, 3, 61, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-06-10 17:48:06'),
(54, 4, 61, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-09-07 17:48:06'),
(55, 5, 61, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-08-15 17:48:06'),
(56, 1, 62, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-09-16 17:48:06'),
(57, 2, 62, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-09-17 17:48:06'),
(58, 3, 62, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-07-01 17:48:06'),
(59, 4, 62, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-07-28 17:48:06'),
(60, 5, 62, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-07-01 17:48:06'),
(61, 1, 63, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-06-12 17:48:06'),
(62, 2, 63, 5, 'Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!', '2026-08-14 17:48:06'),
(63, 3, 63, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-09-06 17:48:06'),
(64, 4, 63, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-07-31 17:48:06'),
(65, 5, 63, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-09-23 17:48:06'),
(66, 1, 64, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-06-16 17:48:06'),
(67, 2, 64, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-09-15 17:48:06'),
(68, 3, 64, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-06-25 17:48:06'),
(69, 4, 64, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-07-20 17:48:06'),
(70, 5, 64, 3, 'Produknya oke, tapi hasilnya belum terlalu kelihatan di minggu pertama.', '2026-08-16 17:48:06'),
(71, 1, 65, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-07-20 17:48:06'),
(72, 2, 65, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-07-29 17:48:06'),
(73, 3, 65, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-07-26 17:48:06'),
(74, 4, 65, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-07-09 17:48:06'),
(75, 5, 65, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-07-09 17:48:06'),
(76, 1, 66, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-06-30 17:48:06'),
(77, 2, 66, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-06-28 17:48:06'),
(78, 3, 66, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-09-20 17:48:06'),
(79, 4, 66, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-08-10 17:48:06'),
(80, 5, 66, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-08-07 17:48:06'),
(81, 1, 67, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-04 17:48:06'),
(82, 2, 67, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-08-01 17:48:06'),
(83, 3, 67, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-08-01 17:48:06'),
(84, 4, 67, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-06-15 17:48:06'),
(85, 5, 67, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-06-19 17:48:06'),
(86, 1, 68, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-07-19 17:48:06'),
(87, 2, 68, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-09-15 17:48:06'),
(88, 3, 68, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-06-29 17:48:06'),
(89, 4, 68, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-07-27 17:48:06'),
(90, 5, 68, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-06-09 17:48:06'),
(91, 1, 69, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-20 17:48:06'),
(92, 2, 69, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-08-03 17:48:06'),
(93, 3, 69, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-09-20 17:48:06'),
(94, 4, 69, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-06-14 17:48:06'),
(95, 5, 69, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-09-04 17:48:06'),
(96, 1, 70, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-09-04 17:48:06'),
(97, 2, 70, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-09-24 17:48:06'),
(98, 3, 70, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-06-22 17:48:06'),
(99, 4, 70, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-29 17:48:06'),
(100, 5, 70, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-06-28 17:48:06'),
(101, 1, 71, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-09-18 17:48:06'),
(102, 2, 71, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-07-26 17:48:06'),
(103, 3, 71, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-09-01 17:48:06'),
(104, 4, 71, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-09-07 17:48:06'),
(105, 5, 71, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-06-30 17:48:06'),
(106, 1, 72, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-07-05 17:48:06'),
(107, 2, 72, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-08-14 17:48:06'),
(108, 3, 72, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-08-09 17:48:06'),
(109, 4, 72, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-08-08 17:48:06'),
(110, 5, 72, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-09-03 17:48:06'),
(111, 1, 73, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-09-26 17:48:06'),
(112, 2, 73, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-10-02 17:48:06'),
(113, 3, 73, 5, 'Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!', '2026-07-26 17:48:06'),
(114, 4, 73, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-07-21 17:48:06'),
(115, 5, 73, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-10-04 17:48:06'),
(116, 1, 74, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-07-06 17:48:06'),
(117, 2, 74, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-09-05 17:48:06'),
(118, 3, 74, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-11 17:48:06'),
(119, 4, 74, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-06-16 17:48:06'),
(120, 5, 74, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-09-25 17:48:06'),
(121, 1, 75, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-08-30 17:48:06'),
(122, 2, 75, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-09-07 17:48:06'),
(123, 3, 75, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-09-18 17:48:06'),
(124, 4, 75, 5, 'Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!', '2026-07-23 17:48:06'),
(125, 5, 75, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-09-03 17:48:06'),
(126, 1, 76, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-06-23 17:48:06'),
(127, 2, 76, 3, 'Produknya original, tapi scent-nya kurang cocok di preferensi saya.', '2026-09-10 17:48:06'),
(128, 3, 76, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-09-22 17:48:06'),
(129, 4, 76, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-08-20 17:48:06'),
(130, 5, 76, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-08-13 17:48:06'),
(131, 1, 77, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-06-16 17:48:06'),
(132, 2, 77, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-07-10 17:48:06'),
(133, 3, 77, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-09-27 17:48:06'),
(134, 4, 77, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-07-03 17:48:06'),
(135, 5, 77, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-06-24 17:48:06'),
(136, 1, 78, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-09-03 17:48:06'),
(137, 2, 78, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-09-10 17:48:06'),
(138, 3, 78, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-08-08 17:48:06'),
(139, 4, 78, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-08-11 17:48:06'),
(140, 5, 78, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-08-30 17:48:06'),
(141, 1, 79, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-09-03 17:48:06'),
(142, 2, 79, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-08-09 17:48:06'),
(143, 3, 79, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-09-28 17:48:06'),
(144, 4, 79, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-06-19 17:48:06'),
(145, 5, 79, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-09-23 17:48:06'),
(146, 1, 80, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-09-13 17:48:06'),
(147, 2, 80, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-08-03 17:48:06'),
(148, 3, 80, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-09-07 17:48:06'),
(149, 4, 80, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-06-11 17:48:06'),
(150, 5, 80, 3, 'Produknya oke, tapi hasilnya belum terlalu kelihatan di minggu pertama.', '2026-09-13 17:48:06'),
(151, 1, 81, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-10-04 17:48:06'),
(152, 2, 81, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-09-01 17:48:06'),
(153, 3, 81, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-08-29 17:48:06'),
(154, 4, 81, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-07-07 17:48:06'),
(155, 5, 81, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-07-12 17:48:06'),
(156, 1, 82, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-09-15 17:48:06'),
(157, 2, 82, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-08-28 17:48:06'),
(158, 3, 82, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-09-27 17:48:06'),
(159, 4, 82, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-07-02 17:48:06'),
(160, 5, 82, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-01 17:48:06'),
(161, 1, 83, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-09-27 17:48:06'),
(162, 2, 83, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-07-22 17:48:06'),
(163, 3, 83, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-08-01 17:48:06'),
(164, 4, 83, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-09-27 17:48:06'),
(165, 5, 83, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-06-18 17:48:06'),
(166, 1, 84, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-09-26 17:48:06'),
(167, 2, 84, 5, 'Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!', '2026-09-26 17:48:06'),
(168, 3, 84, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-08-14 17:48:06'),
(169, 4, 84, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-06-13 17:48:06'),
(170, 5, 84, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-09-03 17:48:06'),
(171, 1, 85, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-17 17:48:06'),
(172, 2, 85, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-08-12 17:48:06'),
(173, 3, 85, 5, 'Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!', '2026-07-24 17:48:06'),
(174, 4, 85, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-08-25 17:48:06'),
(175, 5, 85, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-09-08 17:48:06'),
(176, 1, 86, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-09-04 17:48:06'),
(177, 2, 86, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-08-15 17:48:06'),
(178, 3, 86, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-07-11 17:48:06'),
(179, 4, 86, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-08-07 17:48:06'),
(180, 5, 86, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-06-08 17:48:06'),
(181, 1, 87, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-10-03 17:48:06'),
(182, 2, 87, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-07-17 17:48:06'),
(183, 3, 87, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-09-25 17:48:06'),
(184, 4, 87, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-08-01 17:48:06'),
(185, 5, 87, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-09-18 17:48:06'),
(186, 1, 88, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-06-14 17:48:06'),
(187, 2, 88, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-14 17:48:06'),
(188, 3, 88, 3, 'Teksturnya agak berat untuk kulit berminyak, tapi tetap aman dipakai.', '2026-08-18 17:48:06'),
(189, 4, 88, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-09-14 17:48:06'),
(190, 5, 88, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-06-20 17:48:06'),
(191, 1, 89, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-07-18 17:48:06'),
(192, 2, 89, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-11 17:48:06'),
(193, 3, 89, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-06-07 17:48:06'),
(194, 4, 89, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-14 17:48:06'),
(195, 5, 89, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-09-01 17:48:06'),
(196, 1, 90, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-13 17:48:06'),
(197, 2, 90, 4, 'Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.', '2026-07-01 17:48:06'),
(198, 3, 90, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-09-15 17:48:06'),
(199, 4, 90, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-08-29 17:48:06'),
(200, 5, 90, 3, 'Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.', '2026-09-08 17:48:06'),
(201, 1, 91, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-09-08 17:48:06'),
(202, 2, 91, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-08-01 17:48:06'),
(203, 3, 91, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-09-02 17:48:06'),
(204, 4, 91, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-09-23 17:48:06'),
(205, 5, 91, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-06-20 17:48:06'),
(206, 1, 92, 5, 'Packaging bagus, produk original. Sangat worth it!', '2026-09-29 17:48:06'),
(207, 2, 92, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-08-23 17:48:06'),
(208, 3, 92, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-07-15 17:48:06'),
(209, 4, 92, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-09-14 17:48:06'),
(210, 5, 92, 4, 'Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!', '2026-07-26 17:48:06'),
(211, 1, 93, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-07-25 17:48:06'),
(212, 2, 93, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-09-20 17:48:06'),
(213, 3, 93, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-13 17:48:06'),
(214, 4, 93, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-07-27 17:48:06'),
(215, 5, 93, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-06-20 17:48:06'),
(216, 1, 94, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-07-22 17:48:06'),
(217, 2, 94, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-09-16 17:48:06'),
(218, 3, 94, 5, 'Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!', '2026-09-18 17:48:06'),
(219, 4, 94, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-08-26 17:48:06'),
(220, 5, 94, 3, 'Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.', '2026-06-11 17:48:06'),
(221, 1, 95, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-06-11 17:48:06'),
(222, 2, 95, 4, 'Suka dengan kandungannya, cocok di kulit kombinasi.', '2026-09-08 17:48:06'),
(223, 3, 95, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-07-11 17:48:06'),
(224, 4, 95, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-08-20 17:48:06'),
(225, 5, 95, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-07-17 17:48:06'),
(226, 1, 96, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-06-08 17:48:06'),
(227, 2, 96, 3, 'Teksturnya agak berat untuk kulit berminyak, tapi tetap aman dipakai.', '2026-06-16 17:48:06'),
(228, 3, 96, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-06-24 17:48:06'),
(229, 4, 96, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-06-14 17:48:06'),
(230, 5, 96, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-10-01 17:48:06'),
(231, 1, 97, 4, 'Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.', '2026-07-02 17:48:06'),
(232, 2, 97, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-06-26 17:48:06'),
(233, 3, 97, 4, 'Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.', '2026-06-24 17:48:06'),
(234, 4, 97, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-08-31 17:48:06'),
(235, 5, 97, 5, 'Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.', '2026-06-26 17:48:06'),
(236, 1, 98, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-08-17 17:48:06'),
(237, 2, 98, 5, 'Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.', '2026-06-17 17:48:06'),
(238, 3, 98, 3, 'Produknya original, tapi scent-nya kurang cocok di preferensi saya.', '2026-09-06 17:48:06'),
(239, 4, 98, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-06-22 17:48:06'),
(240, 5, 98, 5, 'Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!', '2026-08-21 17:48:06'),
(241, 1, 99, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-06-21 17:48:06'),
(242, 2, 99, 4, 'Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.', '2026-09-06 17:48:06'),
(243, 3, 99, 4, 'Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.', '2026-07-12 17:48:06'),
(244, 4, 99, 5, 'Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!', '2026-08-14 17:48:06'),
(245, 5, 99, 5, 'Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.', '2026-08-30 17:48:06'),
(246, 1, 100, 5, 'Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!', '2026-06-28 17:48:06'),
(247, 2, 100, 4, 'Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.', '2026-08-21 17:48:06'),
(248, 3, 100, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-08-14 17:48:06'),
(249, 4, 100, 5, 'Kulit yang kusam jadi lebih cerah dan segar. Suka banget!', '2026-08-23 17:48:06'),
(250, 5, 100, 3, 'Produknya oke, tapi hasilnya belum terlalu kelihatan di minggu pertama.', '2026-09-20 17:48:06');

-- --------------------------------------------------------

--
-- Table structure for table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percent','fixed') DEFAULT 'percent',
  `discount_value` int UNSIGNED NOT NULL,
  `min_purchase` int UNSIGNED DEFAULT '0',
  `max_uses` int UNSIGNED DEFAULT NULL,
  `used_count` int UNSIGNED DEFAULT '0',
  `expires_at` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `code`, `discount_type`, `discount_value`, `min_purchase`, `max_uses`, `used_count`, `expires_at`, `is_active`, `created_at`) VALUES
(1, 'GLOW30', 'percent', 30, 100000, 1000, 0, '2026-10-08', 1, '2026-09-23 04:24:31'),
(2, 'FIDEA30', 'fixed', 10000, 30000, 50000, 0, '2026-10-31', 1, '2026-10-05 08:13:58'),
(3, 'NEWUSER5B5C3', 'fixed', 20000, 0, 1, 0, '2026-11-04', 1, '2026-10-05 08:30:10'),
(4, 'NEWUSER640FB', 'fixed', 20000, 0, 1, 1, '2026-11-04', 1, '2026-10-05 10:08:22'),
(5, 'NEWUSER75570', 'fixed', 20000, 0, 1, 1, '2026-11-04', 1, '2026-10-05 14:19:06');

-- --------------------------------------------------------

--
-- Table structure for table `promo_usage`
--

CREATE TABLE `promo_usage` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `promo_code` varchar(50) NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `promo_usage`
--

INSERT INTO `promo_usage` (`id`, `user_id`, `promo_code`, `order_id`, `created_at`) VALUES
(2, 6, 'NEWUSER640FB', 7, '2026-10-05 10:45:35'),
(3, 7, 'NEWUSER75570', 11, '2026-10-05 14:21:49');

-- --------------------------------------------------------

--
-- Table structure for table `shipping_methods`
--

CREATE TABLE `shipping_methods` (
  `id` int UNSIGNED NOT NULL,
  `courier` varchar(50) NOT NULL,
  `service` varchar(50) NOT NULL,
  `description` varchar(150) NOT NULL,
  `estimated_days` varchar(30) NOT NULL,
  `price` int UNSIGNED NOT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `shipping_methods`
--

INSERT INTO `shipping_methods` (`id`, `courier`, `service`, `description`, `estimated_days`, `price`, `is_active`) VALUES
(1, 'JNE', 'REG', 'JNE Reguler', '2-3 hari kerja', 15000, 1),
(2, 'JNE', 'YES', 'JNE Yakin Esok Sampai', '1 hari kerja', 35000, 1),
(3, 'JNE', 'OKE', 'JNE Ongkos Kirim Ekonomis', '3-5 hari kerja', 9000, 1),
(4, 'J&T', 'Regular', 'J&T Express Reguler', '2-3 hari kerja', 13000, 1),
(5, 'J&T', 'Economy', 'J&T Economy', '3-5 hari kerja', 8000, 1),
(6, 'SiCepat', 'BEST', 'SiCepat Besok Sampai', '1 hari kerja', 32000, 1),
(7, 'SiCepat', 'REGPACK', 'SiCepat Reguler', '2-3 hari kerja', 12000, 1),
(8, 'Anteraja', 'Reguler', 'Anteraja Reguler', '2-3 hari kerja', 11000, 1),
(9, 'Anteraja', 'Same Day', 'Anteraja Same Day', 'Hari ini', 45000, 1),
(10, 'GoSend', 'Same Day', 'GoSend Same Day Delivery', 'Hari ini', 25000, 1),
(11, 'GoSend', 'Instant', 'GoSend Instant', '< 3 jam', 35000, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `avatar` varchar(500) DEFAULT NULL,
  `role` enum('customer','admin') DEFAULT 'customer',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `address`, `avatar`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'dey', 'dey@gmail.com', '$2y$12$C8.L8bG3KowOnXvSYsJ7EurBmDJdhhqLTWUOsP75Hcf5Vi14Thp4K', NULL, NULL, NULL, 'customer', 1, '2026-09-23 04:26:32', '2026-09-23 09:25:22'),
(2, 'Admin Fidea', 'admin@fidea.com', '$2y$12$4JXo1SmSy3H/XRW2txH5n.ACQhu4RR0q0E3AgEfeAi1kws0pBm9MG', '081511735040', 'Jl. Raya Puspiptek No. 46, Buaran, Kec. Pamulang, Kota Tangerang Selatan, Banten.', NULL, 'admin', 1, '2026-09-23 09:13:23', '2026-10-05 15:47:57'),
(3, 'Deyfin', 'ddey@fidea.com', '$2y$12$U0/t2LsCiNHoI3K5fWImSe69dciCErtZkMrb8Qav1dw/uxvBkPmCm', NULL, NULL, NULL, 'customer', 1, '2026-09-24 04:14:27', '2026-09-24 04:14:27'),
(4, 'Minmin', 'min@gmail.com', '$2y$12$zaRsR9s78b3EUxOQJeW7wuB/sJ8KOOre4eLSd/m8BIKXOjsqkSmni', NULL, NULL, NULL, 'customer', 1, '2026-10-05 05:02:26', '2026-10-05 05:02:26'),
(5, 'tia', 'tia@gmail.com', '$2y$12$MzxvPIzC5/nM6Pa7OTOw6eB7rZlAkHUiVRIiJK6m5724pSPQdfbai', NULL, NULL, NULL, 'customer', 1, '2026-10-05 08:30:10', '2026-10-05 08:30:10'),
(6, 'nini', 'ni@gmail.com', '$2y$12$bknzdoU2AJNXmeocogDGS.zGvj8ip2Nsq9FycBfQMuzdg3wMArBAK', '0987676575', 'Jl. Mawar No. 1', NULL, 'customer', 1, '2026-10-05 10:08:22', '2026-10-05 14:13:30'),
(7, 'sisi', 'si@gmail.com', '$2y$12$vYQg9DKc.mzddJDTX4VGtew066j0fXDRs1eYQBatgLqZgbjiHL0ea', '08956743556', 'Jl. Murai', NULL, 'customer', 1, '2026-10-05 14:19:06', '2026-10-05 14:20:35');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(1, 4, 53, '2026-10-05 05:06:10'),
(2, 4, 54, '2026-10-05 05:34:52'),
(4, 7, 55, '2026-10-05 17:52:38');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cart_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip_time` (`ip_address`,`attempted_at`),
  ADD KEY `idx_email_time` (`email`,`attempted_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_slug` (`category_slug`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_product` (`user_id`,`product_id`);

--
-- Indexes for table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `promo_usage`
--
ALTER TABLE `promo_usage`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_promo` (`user_id`,`promo_code`);

--
-- Indexes for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wishlist_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=251;

--
-- AUTO_INCREMENT for table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `promo_usage`
--
ALTER TABLE `promo_usage`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_slug`) REFERENCES `categories` (`slug`) ON UPDATE CASCADE;

--
-- Constraints for table `promo_usage`
--
ALTER TABLE `promo_usage`
  ADD CONSTRAINT `promo_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
