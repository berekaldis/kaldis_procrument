import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kaldi-sidebar-collapsed";

function getInitial() {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
}

export function useSidebar() {
    const [collapsed, setCollapsed] = useState(getInitial);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    }, [collapsed]);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((c) => !c);
    }, []);

    return { collapsed, toggleCollapsed };
}

export default useSidebar;
