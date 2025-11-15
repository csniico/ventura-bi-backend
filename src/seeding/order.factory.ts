import { Order, OrderStatus, PaymentStatus } from "src/order/entities/order.entity";
import { setSeederFactory } from "typeorm-extension";

export const OrderFactory = setSeederFactory(Order, (faker) => {
    const order = new Order();
    const subtotal = faker.number.float({ min: 20, max: 5000, fractionDigits: 2 });
    const tax = subtotal * 0.1; // 10% tax
    const shipping = faker.number.float({ min: 5, max: 50, fractionDigits: 2 });
    const discount = faker.number.float({ min: 0, max: subtotal * 0.2, fractionDigits: 2 });
    const total = subtotal + tax + shipping - discount;

    order.status = faker.helpers.arrayElement(Object.values(OrderStatus));
    order.paymentStatus = faker.helpers.arrayElement(Object.values(PaymentStatus));
    order.subtotal = subtotal;
    order.tax = tax;
    order.shipping = shipping;
    order.discount = discount;
    order.total = total;
    order.notes = `Order notes: ${faker.commerce.productDescription()}`;
    order.shippingAddress = `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`;
    if (faker.datatype.boolean({ probability: 0.6 })) {
        order.trackingNumber = `TRK${faker.string.alphanumeric(12).toUpperCase()}`;
    }

    return order;
});
