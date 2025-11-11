/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    console.log('Connecting to database');
    await this.$connect();
    const randomUser: User | null = await this.getRandomUser();
    console.log('Random user: ', randomUser);
  }

  async onModuleDestroy(): Promise<void> {
    console.log('disconnecting from database');
    await this.$disconnect();
  }

  async getRandomUser(): Promise<User | null> {
    const userCount: number = (await this.user.count()) as number;
    const skip = Math.floor(Math.random() * userCount);
    return this.user.findFirst({
      skip,
    });
  }
}
