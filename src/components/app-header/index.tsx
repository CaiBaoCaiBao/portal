"use client";

import { cn } from "@/lib";
import {
    createContext,
    useCallback,
    useContext,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface HeaderEntry {
    id: string;
    order: number;
}

interface HeaderActions {
    register: (id: string, order: number) => void;
    unregister: (id: string) => void;
    setSlot: (node: HTMLElement | null) => void;
}

interface HeaderState {
    host: HTMLElement | null;
    slot: HTMLElement | null;
    activeId: string | null;
}

const HeaderActionsContext = createContext<HeaderActions | null>(null);
const HeaderStateContext = createContext<HeaderState>({
    host: null,
    slot: null,
    activeId: null,
});

let headerOrder = 0;

function takeHeaderOrder() {
    headerOrder += 1;
    return headerOrder;
}

interface AppHeaderFrameProps {
    className?: string;
    children?: ReactNode;
}

/** 布局级头部框架。顶栏由后代 `AppHeader` 挂入，页面内容放在顶栏下方 */
export function AppHeaderFrame({ className, children }: AppHeaderFrameProps) {
    const [host, setHost] = useState<HTMLElement | null>(null);
    const [slot, setSlotState] = useState<HTMLElement | null>(null);
    const [entries, setEntries] = useState<HeaderEntry[]>([]);

    const register = useCallback((id: string, order: number) => {
        setEntries((current) => {
            const next = current.filter((item) => item.id !== id);
            next.push({ id, order });
            next.sort((a, b) => a.order - b.order);
            return next;
        });
    }, []);

    const unregister = useCallback((id: string) => {
        setEntries((current) => current.filter((item) => item.id !== id));
    }, []);

    const setSlot = useCallback((node: HTMLElement | null) => {
        setSlotState(node);
    }, []);

    const actions = useMemo(
        () => ({ register, unregister, setSlot }),
        [register, unregister, setSlot],
    );

    const activeId = entries.length > 0 ? entries[entries.length - 1].id : null;
    const state = useMemo<HeaderState>(
        () => ({ host, slot, activeId }),
        [host, slot, activeId],
    );

    return (
        <HeaderActionsContext.Provider value={actions}>
            <HeaderStateContext.Provider value={state}>
                <div className={cn("grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden", className)}>
                    <div ref={setHost} />
                    <div className="min-h-0 overflow-auto">
                        {children}
                    </div>
                </div>
            </HeaderStateContext.Provider>
        </HeaderActionsContext.Provider>
    );
}

interface AppHeaderProps {
    className?: string;
    /** 顶栏模板，渲染在插槽左侧 */
    children?: ReactNode;
}

/** 顶栏。放在布局或页面里都会挂到 `AppHeaderFrame`；同时存在时，页面级覆盖布局级 */
export function AppHeader({ className, children }: AppHeaderProps) {
    const actions = useContext(HeaderActionsContext);
    const state = useContext(HeaderStateContext);
    const reactId = useId();
    const orderRef = useRef<number | null>(null);
    const [localSlot, setLocalSlot] = useState<HTMLElement | null>(null);

    if (orderRef.current === null) {
        orderRef.current = takeHeaderOrder();
    }

    useLayoutEffect(() => {
        if (!actions) return;
        actions.register(reactId, orderRef.current!);
        return () => actions.unregister(reactId);
    }, [actions, reactId]);

    const setSlot = actions?.setSlot ?? setLocalSlot;
    const header = (
        <header className={cn("flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4", className)}>
            {children}
            <div ref={setSlot} className="flex min-w-0 flex-1 items-center" />
        </header>
    );

    if (!actions) {
        return (
            <HeaderStateContext.Provider value={{ host: null, slot: localSlot, activeId: reactId }}>
                {header}
            </HeaderStateContext.Provider>
        );
    }

    if (!state.host || state.activeId !== reactId) return null;

    return createPortal(header, state.host);
}

interface AppHeaderSlotProps {
    className?: string;
    children?: ReactNode;
}

/** 把子节点传送到当前生效的 `AppHeader` 插槽 */
export function AppHeaderSlot({ className, children }: AppHeaderSlotProps) {
    const { slot } = useContext(HeaderStateContext);

    if (!slot) return null;

    return createPortal(
        <div className={cn("flex min-w-0 flex-1 items-center gap-2", className)}>
            {children}
        </div>,
        slot,
    );
}
