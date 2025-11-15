import { Product } from "src/product/entities/product.entity";
import { setSeederFactory } from "typeorm-extension";


export const ProductFactory = setSeederFactory(Product, (faker) => {
    const product = new Product();
    product.name = faker.commerce.productName();
    product.description = faker.commerce.productDescription();
    product.price = parseFloat(faker.commerce.price({ min: 5, max: 500, dec: 2 }));
    product.costPrice = parseFloat(faker.commerce.price({ min: 3, max: 400, dec: 2 }));
    product.type = faker.helpers.arrayElement(['physical', 'digital', 'service'] as const) as any;
    product.stockQuantity = faker.number.int({ min: 0, max: 1000 });
    product.lowStockThreshold = faker.number.int({ min: 5, max: 50 });
    product.images = [
        faker.image.urlLoremFlickr({ category: 'product', width: 400, height: 400 }),
        faker.image.urlLoremFlickr({ category: 'product', width: 400, height: 400 })
    ];
    product.category = faker.commerce.department();
    product.brand = faker.company.name();
    product.tags = faker.helpers.arrayElements(
        [faker.commerce.productAdjective(), faker.commerce.productMaterial(), faker.commerce.product()],
        { min: 1, max: 3 }
    );
    product.attributes = {
        color: faker.color.human(),
        size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
        weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
        material: faker.commerce.productMaterial()
    };
    product.isActive = faker.datatype.boolean();
    product.isDigital = faker.datatype.boolean();
    product.isFeatured = faker.datatype.boolean();

    return product;
})