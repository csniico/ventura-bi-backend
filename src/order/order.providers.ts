import {
  DATA_SOURCE,
  ORDER_ITEM_REPOSITORY,
  ORDERS_REPOSITORY,
} from 'src/constants';
import { DataSource } from 'typeorm/data-source/index.js';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

export const orderProviders = [
  {
    provide: ORDERS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Order),
    inject: [DATA_SOURCE],
  },
  {
    provide: ORDER_ITEM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OrderItem),
    inject: [DATA_SOURCE],
  },
];
