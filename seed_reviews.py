import random

product_ids = list(range(51, 101))

reviews = {
    5: [
        "Produk ini luar biasa! Kulit terasa lebih lembap dan cerah setelah 2 minggu.",
        "Sangat puas, teksturnya ringan dan cepat meresap. Highly recommended!",
        "Pembelian terbaik saya! Benar-benar mengubah kondisi kulit.",
        "Hasilnya kelihatan setelah seminggu pemakaian rutin. Bakal beli lagi!",
        "Packaging bagus, produk original. Sangat worth it!",
        "Paling cocok di kulit sensitif saya. Tidak iritasi sama sekali.",
        "Wajah jadi lebih glowing setelah pakai ini rutin. Terima kasih!",
        "Langsung terasa bedanya dari pemakaian pertama. Serum favorit baru!",
        "Kulit yang kusam jadi lebih cerah dan segar. Suka banget!",
        "Setelah pakai ini kulit lebih kenyal dan sehat. Recommended!",
    ],
    4: [
        "Produknya bagus dan efektif, hanya butuh waktu sedikit lebih lama.",
        "Cukup puas, kulit terasa lebih lembap. Mungkin akan beli lagi.",
        "Teksturnya ringan dan mudah meresap. Cocok untuk pemakaian sehari-hari.",
        "Produk ori dan sesuai deskripsi. Kulit membaik setelah 3 minggu.",
        "Bagus meski harganya sedikit mahal. Tapi kualitasnya sepadan.",
        "Suka dengan kandungannya, cocok di kulit kombinasi.",
        "Manfaatnya terasa nyata meski butuh konsistensi. Overall worth it.",
        "Kulit lebih terhidrasi setelah pemakaian rutin. Lanjut order!",
    ],
    3: [
        "Produknya oke, tapi hasilnya belum terlalu kelihatan di minggu pertama.",
        "Teksturnya agak berat untuk kulit berminyak, tapi tetap aman dipakai.",
        "Belum ada perubahan signifikan. Mungkin perlu waktu lebih lama.",
        "Produknya original, tapi scent-nya kurang cocok di preferensi saya.",
        "Lumayan bagus, tapi ada produk lain dengan harga sama yang lebih efektif.",
    ],
}

rating_pools = [
    [5, 5, 4, 4, 5],
    [5, 4, 5, 3, 4],
    [4, 5, 5, 4, 4],
    [5, 5, 5, 4, 3],
    [4, 4, 5, 5, 4],
    [5, 3, 4, 5, 4],
    [4, 5, 4, 4, 5],
    [5, 5, 3, 4, 5],
    [4, 4, 4, 5, 5],
    [5, 4, 5, 5, 3],
]

random.seed(42)
rows = []
user_ids = [1, 2, 3, 4, 5]

for i, pid in enumerate(product_ids):
    pool = rating_pools[i % len(rating_pools)]
    for j, rating in enumerate(pool):
        uid = user_ids[j % len(user_ids)]
        comment_list = reviews.get(rating, reviews[3])
        comment = random.choice(comment_list).replace("'", "\\'")
        days_ago = random.randint(1, 120)
        rows.append(
            f"({uid}, {pid}, {rating}, '{comment}', DATE_SUB(NOW(), INTERVAL {days_ago} DAY))"
        )

values = ",\n".join(rows)

sql = """USE glowskin;

TRUNCATE TABLE product_reviews;

INSERT INTO product_reviews (user_id, product_id, rating, comment, created_at) VALUES
""" + values + """;

UPDATE products p
SET
  reviews = (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id),
  rating  = (SELECT ROUND(AVG(rating), 1) FROM product_reviews WHERE product_id = p.id)
WHERE id BETWEEN 51 AND 100;

SELECT id, name, rating, reviews FROM products WHERE id BETWEEN 51 AND 60 ORDER BY id;
"""

with open("seed_reviews.sql", "w", encoding="utf-8") as f:
    f.write(sql)

print(f"Berhasil! Total: {len(rows)} ulasan untuk {len(product_ids)} produk")
