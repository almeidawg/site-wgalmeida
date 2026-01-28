#!/usr/bin/env python3
import re

# Read the file
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the problematic lines
content = re.sub(
    r'const ConstrutoraB\s+rooklin = lazy\(\(\) => import\(\'@/pages/ConstrutoraB\s+rooklin\'\)\);',
    "const ConstrutoraB rooklin = lazy(() => import('@/pages/ConstrutoraB rooklin'));",
    content
)

content = re.sub(
    r'<Route path="/construtora-brooklin" element={<ConstrutoraB\s+rooklin />} />',
    '<Route path="/construtora-brooklin" element={<ConstrutoraB rooklin />} />',
    content
)

# Write back
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed App.jsx")
