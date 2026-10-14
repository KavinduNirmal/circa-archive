/**
 * The file browser's in-world identity.
 *
 * Its own module with no imports, for the same reason the browser and the mail
 * client have one: the chrome, the notices, and the window registry all read
 * these names, and importing each other back would leave the copy undefined.
 */

export const EXPLORER_NAME = "CIRCA Explorer";

/**
 * The window title. Explorer is named for the folder it is showing, so the shell
 * asks for a title per destination rather than using one fixed name.
 */
export function explorerTitle(folder: string): string {
  return `${folder} - ${EXPLORER_NAME}`;
}
