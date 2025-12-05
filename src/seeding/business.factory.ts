import { Business } from 'src/business/entities/business.entity';
import { setSeederFactory } from 'typeorm-extension';

export const BusinessFactory = setSeederFactory(Business, (faker) => {
  const business = new Business();
  const companyName = faker.company.name();
  business.name = companyName;
  business.description = faker.company.catchPhrase();
  const emailDomain = faker.internet.domainName();
  business.email = `info@${emailDomain}`;
  business.phone = `+1-${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
  business.website = faker.internet.url();
  business.address = faker.location.streetAddress();
  business.city = faker.location.city();
  business.state = faker.location.state();
  business.country = faker.location.country();
  business.zipCode = faker.location.zipCode();
  business.taxId = faker.string.alphanumeric(10).toUpperCase();
  business.registrationNumber = faker.string.alphanumeric(12).toUpperCase();
  business.businessHours = {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday: { open: '09:00', close: '17:00' },
    friday: { open: '09:00', close: '17:00' },
    saturday: { open: '10:00', close: '14:00' },
    sunday: { open: '', close: '' },
  };
  business.logo = faker.image.urlLoremFlickr({
    category: 'business',
    width: 200,
    height: 200,
  });

  return business;
});
