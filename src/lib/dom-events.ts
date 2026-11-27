import type { KeyboardEvent, SyntheticEvent } from "react";

export function stopEventBubble(event: SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
}

export function onKeys(
    event: KeyboardEvent<HTMLElement>,
    callback: () => void,
    ...keys: string[]
) {
    if (event.nativeEvent.isComposing || event.repeat) return;
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    callback();
}