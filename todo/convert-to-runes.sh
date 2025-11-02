#!/usr/bin/env bash
# Svelte 5 Runes Conversion Helper Script
# Analyzes Svelte files to help with conversion

set -euo pipefail

PROJECT_ROOT="/home/okita/Scripts/Personal/startPage"
cd "$PROJECT_ROOT"

echo "======================================"
echo "Svelte 5 Runes Conversion Helper"
echo "======================================"
echo ""

# Find all files with export let
FILES=$(find src -name "*.svelte" -type f -exec grep -l "^\s*export let" {} \; 2>/dev/null | sort)

if [ -z "$FILES" ]; then
    echo "✅ No files need conversion! All files are using Svelte 5 runes."
    exit 0
fi

FILE_COUNT=$(echo "$FILES" | wc -l)
echo "📋 Found $FILE_COUNT files that need conversion:"
echo ""

# Analyze each file
for FILE in $FILES; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 $FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Count export lets
    EXPORT_COUNT=$(grep -c "^\s*export let" "$FILE" || echo 0)
    echo "   Props: $EXPORT_COUNT export let statements"

    # Check for event dispatcher
    if grep -q "createEventDispatcher" "$FILE"; then
        DISPATCH_COUNT=$(grep -c "dispatch(" "$FILE" || echo 0)
        echo "   Events: ✓ Uses createEventDispatcher ($DISPATCH_COUNT dispatch calls)"
    else
        echo "   Events: ✗ No event dispatcher"
    fi

    # Check for $$restProps
    if grep -q '\$\$restProps' "$FILE"; then
        echo "   RestProps: ✓ Uses \$\$restProps"
    else
        echo "   RestProps: ✗ No \$\$restProps"
    fi

    # Check for on: event handlers
    ON_EVENTS=$(grep -o 'on:[a-z]\+' "$FILE" | sort -u | tr '\n' ' ' || echo "none")
    if [ "$ON_EVENTS" != "none" ]; then
        echo "   Template Events: $ON_EVENTS"
    fi

    # Show the export let lines
    echo ""
    echo "   Export Props:"
    grep -n "^\s*export let" "$FILE" | sed 's/^/      /' || echo "      (none found)"

    echo ""
done

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "Total files to convert: $FILE_COUNT"
echo ""
echo "📖 Conversion guide: SVELTE5_CONVERSION_GUIDE.md"
echo ""
echo "Next steps:"
echo "1. Read the conversion guide"
echo "2. Start with the simplest files (loading components)"
echo "3. After each conversion, run: yarn check"
echo "4. Run this script again to see progress"
echo ""
echo "Files to convert:"
echo "$FILES" | sed 's/^/  - /'
echo ""
