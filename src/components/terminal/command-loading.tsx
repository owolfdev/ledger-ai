// Create: src/components/terminal/command-loading.tsx

interface CommandLoadingProps {
  command: string;
  status?: string;
}

export default function CommandLoading({
  command,
  status,
}: CommandLoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary select-none hidden sm:block">$</span>
      <div className="flex-1 font-mono pl-2">
        {/* <div className="text-neutral-600 dark:text-neutral-400 mb-1">
          {command}
        </div> */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin w-3 h-3 border border-neutral-300 border-t-neutral-600 rounded-full"></div>
          <span>{status || "Loading..."}</span>
        </div>
      </div>
    </div>
  );
}
