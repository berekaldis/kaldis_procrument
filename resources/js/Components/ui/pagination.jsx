import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button.jsx";

export function Pagination({ meta, onPageChange }) {
    if (!meta || meta.lastPage <= 1) return null;

    const { currentPage, lastPage, total } = meta;

    return (
        <div className="flex items-center justify-between gap-3 px-1 py-2 text-xs text-muted-foreground">
            <span>
                Page {currentPage} of {lastPage} · {total} total
            </span>
            <div className="flex items-center gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    disabled={currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

export default Pagination;
