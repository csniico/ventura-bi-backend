import { Invoice, InvoiceStatus } from 'src/invoice/entities/invoice.entity';
import { setSeederFactory } from 'typeorm-extension';

export const InvoiceFactory = setSeederFactory(Invoice, (faker) => {
  const invoice = new Invoice();
  const issueDate = faker.date.recent({ days: 60 });
  const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

  const subtotal = faker.number.float({
    min: 50,
    max: 10000,
    fractionDigits: 2,
  });
  const tax = subtotal * 0.1; // 10% tax
  const discount = faker.number.float({
    min: 0,
    max: subtotal * 0.15,
    fractionDigits: 2,
  });
  const total = subtotal + tax - discount;
  const amountPaid = faker.helpers.arrayElement([0, total * 0.5, total]);
  const amountDue = total - amountPaid;

  invoice.status = faker.helpers.arrayElement(Object.values(InvoiceStatus));
  invoice.issueDate = issueDate;
  invoice.dueDate = dueDate;
  invoice.subtotal = subtotal;
  invoice.tax = tax;
  invoice.discount = discount;
  invoice.total = total;
  invoice.amountPaid = amountPaid;
  invoice.amountDue = amountDue;
  invoice.notes = `Invoice notes: Please remit payment by due date. Contact ${faker.company.name()} accounting department for questions.`;
  invoice.terms =
    'Payment due within 30 days. Late payments may incur additional charges.';
  invoice.paymentMethod = faker.helpers.arrayElement([
    'Credit Card',
    'Bank Transfer',
    'PayPal',
    'Cash',
    'Check',
  ]);

  const itemCount = faker.number.int({ min: 1, max: 5 });
  invoice.lineItems = Array.from({ length: itemCount }, () => {
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = faker.number.float({
      min: 10,
      max: 500,
      fractionDigits: 2,
    });
    return {
      description: faker.commerce.productName(),
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };
  });

  return invoice;
});
