import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";
import { InventoryPermissions } from "../../../src/shared/security/permissions/InventoryPermissions.js";
import { OrdersPermissions } from "../../../src/shared/security/permissions/OrderPermissions.js";
import { PaymentsPermissions } from "../../../src/shared/security/permissions/PaymentPermissions.js";
import { ProductsPermissions } from "../../../src/shared/security/permissions/ProductPermissions.js";
import { RolesPermissions } from "../../../src/shared/security/permissions/RolePermissions.js";
import { UsersPermissions } from "../../../src/shared/security/permissions/UserPermissions.js";

export const PermissionCatalog=[
    ...Object.values(UsersPermissions),
    ...Object.values(RolesPermissions),
    ...Object.values(ProductsPermissions),
    ...Object.values(InventoryPermissions),
    ...Object.values(OrdersPermissions),
    ...Object.values(PaymentsPermissions),
    ...Object.values(AttachmentsPermissions),
];