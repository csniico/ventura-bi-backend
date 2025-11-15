import { OrderItem } from "src/order/entities/order-item.entity";
import { setSeederFactory } from "typeorm-extension";

export const OrderItemFactory = setSeederFactory(OrderItem, (faker) => {
    const orderItem = new OrderItem();
    const unitPrice = faker.number.float({ min: 5, max: 500, fractionDigits: 2 });
    const quantity = faker.number.int({ min: 1, max: 10 });
    const discount = faker.number.float({ min: 0, max: unitPrice * quantity * 0.15, fractionDigits: 2 });
    const tax = (unitPrice * quantity - discount) * 0.1; // 10% tax
    const subtotal = (unitPrice * quantity) - discount + tax;

    orderItem.productName = faker.commerce.productName();
    orderItem.unitPrice = unitPrice;
    orderItem.quantity = quantity;
    orderItem.discount = discount;
    orderItem.tax = tax;
    orderItem.subtotal = subtotal;
    if (faker.datatype.boolean({ probability: 0.3 })) {
        orderItem.notes = `Item note: ${faker.commerce.productAdjective()} quality`;
    }

    return orderItem;
});
