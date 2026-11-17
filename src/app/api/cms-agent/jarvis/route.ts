import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { DynamicModuleRegistry } from "@/services/agent/dynamicModuleRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const apiUser = await apiAccess(req);
  if (apiUser instanceof Response) return apiUser;

  const modules = DynamicModuleRegistry.getAllModules();
  const routes = DynamicModuleRegistry.getAllRoutes();

  return NextResponse.json(
    {
      status: "active",
      engine: "Haryana Police CMS - Solo Voice Copilot Engine",
      wakeWord: "Hey CMS",
      mode: "browser_native_solo",
      moduleCount: modules.length,
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        titleHi: m.titleHi,
        path: m.path,
        category: m.category,
        subRouteCount: m.subRoutes?.length || 0,
        supportedActions: m.supportedActions,
      })),
      routesCount: routes.length,
      routes: routes.map((r) => ({
        path: r.path,
        title: r.title,
        category: r.category,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const apiUser = await apiAccess(req);
  if (apiUser instanceof Response) return apiUser;

  try {
    const body = await req.json();
    const { action, query, newModule } = body;

    // 1. Dynamic Module Registration at runtime
    if (action === "register_module" && newModule) {
      DynamicModuleRegistry.registerModule(newModule);
      return NextResponse.json({
        success: true,
        message: `Module '${newModule.id}' registered successfully.`,
        totalModules: DynamicModuleRegistry.getAllModules().length,
      });
    }

    // 2. Intent matching query
    if (query) {
      const match = DynamicModuleRegistry.matchIntentToRoute(query);
      return NextResponse.json({
        success: true,
        query,
        matchedRoute: match,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Jarvis CMS Bridge API active",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Invalid request" },
      { status: 400 }
    );
  }
}
