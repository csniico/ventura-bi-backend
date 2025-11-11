import { Prisma } from '../generated/prisma/client';

export const userData: Prisma.UserCreateInput[] = [
  {
    googleId: 'google_admin_123',
    email: 'admin@ventura.com',
    firstname: 'Admin',
    lastname: 'Ventura',
    avatar: 'https://picsum.photos/200',
  },
];
