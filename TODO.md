https://docs.nestjs.com/techniques/configuration

https://docs.nestjs.com/techniques/database

transaction: https://docs.nestjs.com/techniques/database#transactions

prisma transaction docs url: https://www.prisma.io/docs/concepts/components/prisma-client/transactions

service.spec.ts

- update email of user
- update profile photo of user

TypeError: Cannot read properties of undefined (reading 'managerPassword')

typing, error handling

no password use in commu.
so => make public profile, private profile

id 대신 name만 공개시키기

unique key with soft delete => unique check를 db에서 하는 것이 아니라 추가할 때 하기?

dto에서는 기본적으로 name만 받기

decorator를 통해 현재 초점 두는 Space에 대해 쉽게 접근할 수 있도록 하기
=> 삭제한 space에 대한 post, comment 등의 접근 막기

defaultRole rename to defaultCreatorRole

typing validation; https://www.prisma.io/docs/concepts/components/prisma-client/custom-validation

swagger

forwardRef 삭제하기!

name은 unique하지 않게 만들기

prisma - middleware 추가하기

class validator

create, add
delete, remove, destroy(완전 삭제) - 


db가 아닌 profile에서 deletedAt 처리