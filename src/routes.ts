import { UserController } from "./controller/UserController";
import { UserGroupController } from "./controller/UserGroupController";

export const Routes = [
  {
    method: "get",
    route: "/users",
    controller: UserController,
    action: "getAllUsers",
  },
  {
    method: "get",
    route: "/users/filter/name",
    controller: UserController,
    action: "filterByUserName",
  },
  {
    method: "get",
    route: "/users/filter/email",
    controller: UserController,
    action: "filterByEmail",
  },
  {
    method: "post",
    route: "/users/statuses",
    controller: UserController,
    action: "updateUsersStatuses",
  },
  {
    method: "delete",
    route: "/users/:id/removeGroup",
    controller: UserController,
    action: "removeUserFromGroup",
  },
  {
    method: "post",
    route: "/users/:userId/addGroup/:groupId",
    controller: UserController,
    action: "addUserToGroup",
  },
  {
    method: "post",
    route: "/groups/add",
    controller: UserGroupController,
    action: "addUserGroup",
  },
  {
    method: "get",
    route: "/groups/get",
    controller: UserGroupController,
    action: "getAllUserGroups",
  },
];
