import { Business } from 'src/business/entities/business.entity';
import { setSeederFactory } from 'typeorm-extension';

export const BusinessFactory = setSeederFactory(Business, (faker) => {
  const business = new Business();
  business.name = faker.company.name();
  business.description = faker.company.catchPhrase();
  const emailDomain = faker.internet.domainName();
  business.email = `info@${emailDomain}`;
  business.phone = `+1-${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
  business.website = faker.internet.url();
  business.address = faker.location.streetAddress();
  business.city = faker.location.city();
  business.state = faker.location.state();
  business.country = faker.location.country();

  return business;
});
