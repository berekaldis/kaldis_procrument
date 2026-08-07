import * as XLSX from "xlsx";

/**
 * Normalizes text by trimming whitespace.
 */
function cleanStr(val) {
    if (val === null || val === undefined) return "";
    return String(val).trim();
}

/**
 * Cleans TIN number string, stripping leading slashes like "/0026286081".
 */
function cleanTin(val) {
    let tin = cleanStr(val);
    if (tin.startsWith("/")) {
        tin = tin.substring(1).trim();
    }
    return tin;
}

/**
 * Formats phone / telegram numbers.
 * Converts "929034106" -> "0929034106" or "+251929034106"
 */
function cleanPhone(val) {
    let phone = cleanStr(val);
    if (!phone) return "";
    
    // Remove formatting like spaces, hyphens, parentheses
    phone = phone.replace(/[\s\-\(\)]/g, "");

    // If 8 or 9 digits and doesn't start with 0 or +, add leading 0
    if (/^[1-9]\d{7,8}$/.test(phone)) {
        phone = "0" + phone;
    }
    
    return phone;
}

/**
 * Cleans section category names like "CLENING MATERIALS" -> "Cleaning Materials"
 * or preserves clean title case.
 */
export function cleanCategoryName(catStr) {
    if (!catStr) return "";
    let name = cleanStr(catStr);
    
    // Strip leading number prefix e.g. "1 ", "2. ", "3 - "
    name = name.replace(/^\d+[\s\.\-\:]*/, "").trim();
    
    if (!name) return "";

    return name
        .toLowerCase()
        .replace(/(?:^|\s|-|\/)\S/g, (a) => a.toUpperCase());
}

/**
 * Parses an Excel or CSV file buffer / ArrayBuffer.
 * Returns an array of parsed supplier objects.
 */
export function parseSupplierExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error("Excel file has no visible sheets.");
    }
    
    const worksheet = workbook.Sheets[sheetName];
    // Get 2D array of raw values
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    const parsedSuppliers = [];
    let currentCategory = "";
    let colMap = null; // { categoryIdx, nameIdx, addressIdx, contactIdx, phoneIdx, bankNameIdx, bankAccIdx, tinIdx, itemsIdx }

    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.every((c) => cleanStr(c) === "")) {
            continue; // Skip empty rows
        }

        const nonEmpCells = row.map((c) => cleanStr(c)).filter(Boolean);
        const firstCell = cleanStr(row[0] || row[1]);

        const isHeaderRowCandidate = row.some((c) => {
            const str = cleanStr(c).toUpperCase();
            return (
                str.includes("SUPPLYER") ||
                str.includes("SUPPLIER") ||
                str.includes("TIN NUMBER") ||
                str.includes("TIN") ||
                str.includes("CATEGORY") ||
                str.includes("CATAGORY")
            );
        });

        if (isHeaderRowCandidate && !colMap) {
            // Detect column mapping indices
            colMap = {
                categoryIdx: -1,
                nameIdx: -1,
                addressIdx: -1,
                contactIdx: -1,
                phoneIdx: -1,
                bankNameIdx: -1,
                bankAccIdx: -1,
                tinIdx: -1,
                itemsIdx: -1,
            };

            row.forEach((cell, idx) => {
                const header = cleanStr(cell).toUpperCase();
                if (header.includes("CATEGORY") || header.includes("CATAGORY") || header.includes("SECTOR")) {
                    colMap.categoryIdx = idx;
                } else if (header.includes("SUPPLYER") || header.includes("SUPPLIER") || header.includes("COMPANY")) {
                    colMap.nameIdx = idx;
                } else if (header.includes("ADDRESS") || header.includes("LOCATION")) {
                    colMap.addressIdx = idx;
                } else if (header.includes("CONTACT")) {
                    colMap.contactIdx = idx;
                } else if (header.includes("TELEGRAM") || header.includes("PHONE") || header.includes("MOBILE")) {
                    colMap.phoneIdx = idx;
                } else if (header.includes("BANK NAM") || header.includes("BANK NAME") || header === "BANK") {
                    colMap.bankNameIdx = idx;
                } else if (header.includes("ACCAOUNT") || header.includes("ACCOUNT")) {
                    colMap.bankAccIdx = idx;
                } else if (header.includes("TIN")) {
                    colMap.tinIdx = idx;
                } else if (header.includes("ITEM")) {
                    colMap.itemsIdx = idx;
                }
            });

            continue; // Header row processed, move to next row
        }

        // If no header row was detected yet, use default column indices matching user's layout:
        // Col 0: NO, Col 1 (B): CATEGORY, Col 2 (C): SUPPLYER NAMES, Col 3 (D): ADDRESS, Col 4 (E): CONTACT PERS, Col 5 (F): TELEGRAM N, Col 6 (G): BANK NA, Col 7 (H): ACCAOUNT NUM, Col 8 (I): TIN NUMBER
        const map = colMap || {
            categoryIdx: 1,
            nameIdx: 2,
            addressIdx: 3,
            contactIdx: 4,
            phoneIdx: 5,
            bankNameIdx: 6,
            bankAccIdx: 7,
            tinIdx: 8,
        };

        const legalName = map.nameIdx >= 0 ? cleanStr(row[map.nameIdx]) : "";

        // Skip if supplier name is empty or repeating header text
        if (
            !legalName ||
            legalName.toUpperCase().includes("SUPPLYER") ||
            legalName.toUpperCase().includes("SUPPLIER")
        ) {
            // Check if this row is a section category banner (e.g. "1 CLENING MATERIALS")
            if (
                nonEmpCells.length > 0 &&
                nonEmpCells.length <= 3 &&
                (firstCell.match(/^\d+\s+[A-Z]/i) ||
                    nonEmpCells.some((c) =>
                        c.match(/MATERIALS|FOOD|SERVICE|ITEMS|EQUIPMENT|SUPPLIES|GOODS/i)
                    ))
            ) {
                const detectedCat = nonEmpCells.find((c) => c.length > 2) || firstCell;
                currentCategory = cleanCategoryName(detectedCat);
            }
            continue;
        }

        // Category determination: per-row CATEGORY column first, then banner category fallback
        let rowCategory = "";
        if (map.categoryIdx >= 0 && cleanStr(row[map.categoryIdx])) {
            rowCategory = cleanCategoryName(row[map.categoryIdx]);
        }
        if (!rowCategory) {
            rowCategory = currentCategory || "General";
        }

        const address = map.addressIdx >= 0 ? cleanStr(row[map.addressIdx]) : "";
        const contactName = map.contactIdx >= 0 ? cleanStr(row[map.contactIdx]) : "";
        const contactPhone = map.phoneIdx >= 0 ? cleanPhone(row[map.phoneIdx]) : "";
        const bankName = map.bankNameIdx >= 0 ? cleanStr(row[map.bankNameIdx]) : "";
        const bankAcc = map.bankAccIdx >= 0 ? cleanStr(row[map.bankAccIdx]) : "";
        const tin = map.tinIdx >= 0 ? cleanTin(row[map.tinIdx]) : "";

        // Combine Bank Name and Account Number into bankDetails
        let bankDetails = "";
        if (bankName && bankAcc) {
            bankDetails = `${bankName} - Account: ${bankAcc}`;
        } else if (bankName) {
            bankDetails = bankName;
        } else if (bankAcc) {
            bankDetails = `Account: ${bankAcc}`;
        }

        // Save address in notes if present
        let notes = "";
        if (address) {
            notes = `Address: ${address}`;
        }

        parsedSuppliers.push({
            id: `row-${r}`,
            rowIndex: r + 1,
            legalName,
            tradeName: "",
            tin,
            contactName,
            contactPhone,
            bankDetails,
            notes,
            categoryTags: rowCategory,
            selected: true,
        });
    }

    return parsedSuppliers;
}
