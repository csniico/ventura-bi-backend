import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { BUSINESS_REPOSITORY, DATA_SOURCE, USER_REPOSITORY } from "src/constants";
import { Business } from "src/business/entities/business.entity";

export const userProviders = [
    {
        provide: USER_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
        inject: [DATA_SOURCE],
    },
    {
        provide: BUSINESS_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Business),
        inject: [DATA_SOURCE],
    }
]