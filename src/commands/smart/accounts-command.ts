// /commands/smart/accounts-command.ts
// Accounts management command for the terminal

import { loadAccountMappings } from "../../lib/ledger/account-mappings";

export interface AccountsCommandArgs {
  subcommand?: string;
  alias?: string;
  accountPath?: string;
  type?: string;
  category?: string;
  setDefault?: boolean;
}

export function handleAccountsCommand(args: AccountsCommandArgs): string {
  const { subcommand, alias, accountPath, type, category } = args;

  switch (subcommand) {
    case "add":
      return addAccount(alias!, accountPath!, type!, category!);
    case "list":
    case "ls":
      return listAccounts();
    case "show":
      return showAccount(alias!);
    case "edit":
      return editAccount(alias!, accountPath!, type!, category!);
    case "delete":
    case "del":
      return deleteAccount(alias!);
    case "set-default":
      return setDefaultAccount(alias!);
    case "help":
    case undefined:
      return showAccountsHelp();
    default:
      return `Unknown subcommand: ${subcommand}. Use 'accounts help' for usage.`;
  }
}

function addAccount(
  alias: string,
  accountPath: string,
  type: string,
  category: string
): string {
  if (!alias || !accountPath) {
    return "Usage: accounts add <alias> <accountPath> [--type <type>] [--category <category>]";
  }

  // Validate account path format (basic validation)
  if (!isValidAccountPath(accountPath)) {
    return `Invalid account path: ${accountPath}. Account paths should use colon-separated segments.`;
  }

  // Validate type
  const validTypes = ["asset", "liability", "equity", "income", "expense"];
  if (type && !validTypes.includes(type)) {
    return `Invalid type: ${type}. Valid types are: ${validTypes.join(", ")}`;
  }

  // For now, just return a success message
  // In Phase 3, this will actually save to the JSON file
  return `✅ Account mapping added:
  Alias: ${alias}
  Account: ${accountPath}
  Type: ${type || "asset"}
  Category: ${category || "general"}

Note: This is a preview. File persistence will be implemented in Phase 3.`;
}

function listAccounts(): string {
  const mappings = loadAccountMappings();
  const accounts = Object.entries(mappings.paymentMethods);

  if (accounts.length === 0) {
    return "No account mappings found.";
  }

  let output = "📋 Account Mappings:\n\n";

  accounts.forEach(([alias, mapping]) => {
    const defaultFlag = mapping.isDefault ? " (default)" : "";
    const typeInfo = `[${mapping.type.toUpperCase()}]`;
    const categoryInfo = mapping.category ? ` - ${mapping.category}` : "";

    output += `${alias}${defaultFlag}\n`;
    output += `  ${mapping.accountPath} ${typeInfo}${categoryInfo}\n\n`;
  });

  return output;
}

function showAccount(alias: string): string {
  if (!alias) {
    return "Usage: accounts show <alias>";
  }

  const mappings = loadAccountMappings();
  const mapping = mappings.paymentMethods[alias.toLowerCase()];

  if (!mapping) {
    return `Account mapping not found: ${alias}`;
  }

  return (
    `📊 Account Details for "${alias}":\n\n` +
    `Account Path: ${mapping.accountPath}\n` +
    `Type: ${mapping.type}\n` +
    `Category: ${mapping.category}\n` +
    `Default: ${mapping.isDefault ? "Yes" : "No"}`
  );
}

function editAccount(
  alias: string,
  accountPath: string,
  type: string,
  category: string
): string {
  if (!alias || !accountPath) {
    return "Usage: accounts edit <alias> <newAccountPath> [--type <type>] [--category <category>]";
  }

  const mappings = loadAccountMappings();
  if (!mappings.paymentMethods[alias.toLowerCase()]) {
    return `Account mapping not found: ${alias}`;
  }

  if (!isValidAccountPath(accountPath)) {
    return `Invalid account path: ${accountPath}. Account paths should use colon-separated segments.`;
  }

  return `✅ Account mapping updated:
  Alias: ${alias}
  New Account: ${accountPath}
  Type: ${type || "unchanged"}
  Category: ${category || "unchanged"}

Note: This is a preview. File persistence will be implemented in Phase 3.`;
}

function deleteAccount(alias: string): string {
  if (!alias) {
    return "Usage: accounts delete <alias>";
  }

  const mappings = loadAccountMappings();
  if (!mappings.paymentMethods[alias.toLowerCase()]) {
    return `Account mapping not found: ${alias}`;
  }

  if (mappings.paymentMethods[alias.toLowerCase()].isDefault) {
    return `Cannot delete default account: ${alias}. Set a new default first.`;
  }

  return `✅ Account mapping deleted: ${alias}

Note: This is a preview. File persistence will be implemented in Phase 3.`;
}

function setDefaultAccount(alias: string): string {
  if (!alias) {
    return "Usage: accounts set-default <alias>";
  }

  const mappings = loadAccountMappings();
  if (!mappings.paymentMethods[alias.toLowerCase()]) {
    return `Account mapping not found: ${alias}`;
  }

  return `✅ Default account set to: ${alias}

Note: This is a preview. File persistence will be implemented in Phase 3.`;
}

function showAccountsHelp(): string {
  return `📚 Accounts Command Help

Usage: accounts <subcommand> [options]

Subcommands:
  list, ls                    List all account mappings
  show <alias>               Show details for a specific account
  add <alias> <accountPath>  Add a new account mapping
  edit <alias> <accountPath> Edit an existing account mapping
  delete, del <alias>        Delete an account mapping
  set-default <alias>        Set an account as the default
  help                       Show this help message

Examples:
  accounts list
  accounts show kasikorn
  accounts add scb "Assets:Bank:SCB:Savings" --type asset --category bank
  accounts edit kasikorn "Assets:Bank:Kasikorn:Checking"
  accounts delete paypal
  accounts set-default kasikorn

Note: File persistence will be implemented in Phase 3.`;
}

function isValidAccountPath(accountPath: string): boolean {
  // Basic validation: should contain at least one colon and valid characters
  return (
    accountPath.includes(":") &&
    /^[A-Za-z0-9:]+$/.test(accountPath) &&
    !accountPath.startsWith(":") &&
    !accountPath.endsWith(":")
  );
}
