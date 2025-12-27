import { type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Menu } from "lucide-react";
import NewsletterSidebar from "~/app/_components/Newsletter/NewsletterSidebar";

/**
 * Provides a responsive newsletter layout with a drawer-style sidebar on mobile and a persistent left sidebar on large screens.
 *
 * Renders the supplied children as the main content area while displaying the "Newsletter Archive" sidebar in a mobile sheet and a desktop aside.
 *
 * @param children - Content to render in the main area of the layout
 * @returns The layout element containing the sidebar and main content
 */
export default function NewsletterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-screen">
      {/* Mobile menu button */}
      <div className="border-border bg-background fixed top-0 right-0 left-0 z-10 border-b px-4 py-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0">
            <div className="flex h-full flex-col">
              <div className="border-sidebar-border border-b px-6 py-5">
                <h2 className="text-xl font-bold">Newsletter Archive</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NewsletterSidebar />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar - hidden on mobile */}
      <aside className="border-sidebar-border bg-sidebar fixed top-0 left-0 hidden h-screen w-[280px] shrink-0 border-r lg:block">
        <div className="flex h-full flex-col">
          <div className="border-sidebar-border border-b px-6 py-5">
            <h2 className="text-sidebar-foreground text-lg font-bold">
              Newsletter Archive
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NewsletterSidebar />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-[280px]">
        <div className="mx-auto max-w-4xl px-6 py-12 md:px-16 lg:py-16">
          {children}
        </div>
      </main>
    </div>
  );
}