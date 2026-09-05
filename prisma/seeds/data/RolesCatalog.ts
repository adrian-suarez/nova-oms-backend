import { InventoryPermissions } from "../../../src/shared/security/permissions/InventoryPermissions.js";
import { OrdersPermissions } from "../../../src/shared/security/permissions/OrderPermissions.js";
import { PaymentsPermissions } from "../../../src/shared/security/permissions/PaymentPermissions.js";
import { PermissionCatalog } from "./PermissionsCatalog.js";
import { ProductsPermissions } from "../../../src/shared/security/permissions/ProductPermissions.js";
import { UsersPermissions } from "../../../src/shared/security/permissions/UserPermissions.js";

export const RolesCatalog=[
    {
        name:"ADMIN",
        description:"System administrator"
    },

    {
        name:"SUPPORT",
        description:"Customer support"
    },

    {
        name:"INVENTORY_MANAGER",
        description:"Inventory manager"
    },

    {
        name:"ORDER_MANAGER",
        description:"Order manager"
    },

    {
        name:"REPORT_ANALYST",
        description:"Report analyst"
    }
];


export const RolePermissionCatalog = {

    ADMIN: PermissionCatalog,

    SUPPORT: [

        UsersPermissions.READ,

        UsersPermissions.UPDATE,

        OrdersPermissions.READ,

        OrdersPermissions.UPDATE,

        PaymentsPermissions.REFUND,

        // NotificationsPermissions.SEND

    ],

    INVENTORY_MANAGER: [

        ProductsPermissions.READ,

        ProductsPermissions.CREATE,

        ProductsPermissions.UPDATE,

        ProductsPermissions.DELETE,

        InventoryPermissions.READ,

        InventoryPermissions.UPDATE

    ],

    ORDER_MANAGER: [

        OrdersPermissions.READ,

        OrdersPermissions.CREATE,

        OrdersPermissions.UPDATE,

        OrdersPermissions.CANCEL,

        ProductsPermissions.READ,

        PaymentsPermissions.READ

    ],

    REPORT_ANALYST: [

        // ReportsPermissions.READ,

        // ReportsPermissions.GENERATE,

        // ReportsPermissions.EXPORT,

        OrdersPermissions.READ,

        PaymentsPermissions.READ

    ]

} as const;