import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import console from 'console';
import * as dotenv from 'dotenv';
import { isDev } from 'src/util';
dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl = isDev
      ? process.env.MYSQL_URL_DEV
      : process.env.MYSQL_URL_PROD;
    super({
      datasources: { db: { url: dbUrl } },
    });

    this.$on<any>('query', function queryEventLogger(event: Prisma.QueryEvent) {
      console.log('Query: ' + event.query);
      console.log('Params: ' + event.params);
      console.log('Duration: ' + event.duration + 'ms');
      console.log('Timestamp: ' + event.timestamp + 'ms');
    });
    this.$use(async function queryResultLogger(
      params: Prisma.MiddlewareParams,
      next,
    ) {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(
        `Query ${params.model}.${params.action} took ${after - before}ms`,
      );
      //   console.log(`Result ${JSON.stringify(result)}`);
      return result;
    });
    this.$use(async function softDeleteMiddleware(params, next) {
      if (params.action == 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      if (params.action == 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data != undefined) {
          params.args.data['deleted'] = true; // TODO - check if this works; why deleted instead of deletedAt?
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
