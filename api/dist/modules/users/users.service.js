"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../auth/schemas/user.schema");
let UsersService = UsersService_1 = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async findAll(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.role) {
            filter.role = query.role;
        }
        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }
        const [users, total] = await Promise.all([
            this.userModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            items: users.map((u) => this.mapToUserProfile(u)),
            total,
            page,
            limit,
            totalPages,
        };
    }
    async findById(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID '${id}' not found`);
        }
        return this.mapToUserProfile(user);
    }
    async update(id, updateUserDto) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID '${id}' not found`);
        }
        if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
            const emailConflict = await this.userModel
                .findOne({
                email: updateUserDto.email.toLowerCase(),
                _id: { $ne: id },
            })
                .exec();
            if (emailConflict) {
                throw new common_1.ConflictException(`Email '${updateUserDto.email}' is already in use by another user`);
            }
            user.email = updateUserDto.email.toLowerCase();
        }
        if (updateUserDto.name) {
            user.name = updateUserDto.name.trim();
        }
        if (updateUserDto.role) {
            user.role = updateUserDto.role;
        }
        const updatedUser = await user.save();
        this.logger.log(`User ID '${id}' updated by administrator`);
        return this.mapToUserProfile(updatedUser);
    }
    async updateStatus(id, statusDto) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID '${id}' not found`);
        }
        user.isActive = statusDto.isActive;
        if (!statusDto.isActive) {
            user.refreshTokenHash = null;
            this.logger.warn(`User ID '${id}' deactivated and refresh tokens revoked`);
        }
        else {
            this.logger.log(`User ID '${id}' reactivated`);
        }
        const savedUser = await user.save();
        return this.mapToUserProfile(savedUser);
    }
    mapToUserProfile(user) {
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map