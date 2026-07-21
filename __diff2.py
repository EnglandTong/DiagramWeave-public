with open(r'D:\Development\VisualProjectManagement\DiagramWeave-Public\flowchart-editor.js', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')
line = lines[3944]
print('current line len:', len(line))
print('last 8:')
for i in range(len(line) - 8, len(line)):
    b = line[i]
    c = chr(b) if 32 <= b < 127 else f'\\x{b:02x}'
    print(f'  byte {i}: 0x{b:02x} = {c}')
print()
# what we WANT (HEAD 3927):
want = b'  const focusable = [...overlay.querySelectorAll(\'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])\')]\r'
print('expected (HEAD) last 8:')
for i in range(len(want) - 8, len(want)):
    b = want[i]
    c = chr(b) if 32 <= b < 127 else f'\\x{b:02x}'
    print(f'  byte {i}: 0x{b:02x} = {c}')
print()
print('current =', line == want, 'len match:', len(line) == len(want))
# find first diff
for i in range(min(len(line), len(want))):
    if line[i] != want[i]:
        print('first diff at byte', i)
        print('  current:', hex(line[i]), repr(chr(line[i]) if 32 <= line[i] < 127 else f'\\\\x{line[i]:02x}'))
        print('  want:   ', hex(want[i]), repr(chr(want[i]) if 32 <= want[i] < 127 else f'\\\\x{want[i]:02x}'))
        print('  current context:', line[max(0,i-3):i+5])
        print('  want context:   ', want[max(0,i-3):i+5])
        break
