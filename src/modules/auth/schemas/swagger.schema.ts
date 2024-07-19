import { getSchemaPath } from '@nestjs/swagger';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { UserDto } from 'src/modules/users/dto/user.dto';

export const AuthResponseSchema: SchemaObject & Partial<ReferenceObject> = {
  type: 'object',
  properties: {
    user: { $ref: getSchemaPath(UserDto) },
    access_token: {
      type: 'string',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjVlN2Y1Ni1jZTUxLTQ0MjgtOWQ0My04NGUzNWEwNzc2MTgiLCJpYXQiOjE3MTkxMDE2MzcsImV4cCI6MTcxOTE4ODAzN30.HtTcnhk9rdwprQWS80ITJxrXPf3ln4SXTNRIRXYBpb8',
    },
  },
};
