// import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// import { Space, UserSpace } from '@prisma/client';
// @Injectable()
// export class MemberGuard implements CanActivate {
//   constructor(private userId: string, private spaceId: string) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const user = request.user;
//     const body = request.body;
//     const space: Space & { userSpace: UserSpace[] } =
//       await prismaService.space.findFirst({
//         where: { id: body.spaceId },
//         include: { userSpace: true },
//       });
//     const isMember = space.userSpace.some(
//       (userSpace: UserSpace): boolean => userSpace.userId === body.userId,
//     );
//     return isMember;
//   }
// }
