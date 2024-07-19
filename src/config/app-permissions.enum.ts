export enum AppPermissions {
  // ---------------------------------------------------------------
  // USERS PERMISSIONS
  // ---------------------------------------------------------------
  READ_USERS = 'READ_USERS',
  CREATE_NEW_USER = 'CREATE_NEW_USER',
  UPDATE_USER = 'UPDATE_USER',
  READ_USER = 'READ_USER',
  DELETE_USER = 'DELETE_USER',

  // ---------------------------------------------------------------
  // ROLES PERMISSIONS
  // ---------------------------------------------------------------
  CREATE_ROLE = 'CREATE_ROLE',
  READ_ROLE = 'READ_ROLE',
  UPDATE_ROLE = 'UPDATE_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',
  ADD_USER_ROLE = 'ADD_USER_ROLE',
  REMOVE_USER_ROLE = 'REMOVE_USER_ROLE',
  // ---------------------------------------------------------------
  // SUPER ADMIN PERMISSIONS
  // ---------------------------------------------------------------
  INSTALL_CLOUDINARY_PRESETS = 'INSTALL_CLOUD_PRESETS',
}
