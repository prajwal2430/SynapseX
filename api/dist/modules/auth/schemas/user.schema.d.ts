import { Document } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';
export type UserDocument = User & Document;
export declare class User {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
    isActive: boolean;
    refreshTokenHash: string | null;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
