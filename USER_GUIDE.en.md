# DiagramWeave User Guide

This guide explains how to start DiagramWeave, draw flowcharts, save your work, and export files.

## 1. Start

### Windows Launcher

Double-click `start-diagramweave.bat` in the project root. Chinese Windows users can also use `启动DiagramWeave.bat`.

Before first launch, install the official Node.js LTS: <https://nodejs.org/>. The official installer includes npm.

On first launch, the script will:

1. Check Node.js.
2. Install project dependencies.
3. Copy required `vendor/` files.
4. Sync a Chinese font for PDF export.
5. Start the local service and open the browser.

### Command Line

```bash
pnpm install
pnpm serve
```

Then open:

<http://127.0.0.1:4173/flowchart-editor.html>

Do not open the HTML file directly with `file://`. Use the local HTTP service, otherwise connections, import/export, or asset loading may not work correctly.

If Windows shows "Smart App Control blocked a potentially unsafe file", see [`WINDOWS_START.md`](WINDOWS_START.md) to unblock the downloaded files or start from the command line.

## 2. Interface

| Area | Purpose |
|---|---|
| Top toolbar | Select, connect, pan, undo/redo, auto layout, import/export, settings |
| Left shape palette | Drag process, decision, document, data, storage, and other shapes onto the canvas |
| Canvas | Draw and edit the flowchart |
| Right properties panel | Edit the current page, selected node, or selected connection |
| Bottom hint bar | Shows shortcuts and operation hints |

## 3. Draw Nodes

1. Drag a shape from the left palette onto the canvas.
2. Click the node to select it.
3. Edit its label, role, details, duration, layer, and colors in the right properties panel.
4. Drag the node to move it.
5. Select a node and press `Delete` to remove it.

Common shapes:

| Shape | Typical Use |
|---|---|
| Process | A normal step |
| Decision | Yes/no or branching logic |
| Start / End | Start or end of a process |
| Document | Document, form, or output |
| Data / Storage | Data input, database, or storage |
| Subprocess | A reusable subprocess step |
| Off-page | Link to another page |

## 4. Connections

### Create a Connection

1. Click the connection tool in the toolbar, or press `L`.
2. Drag from a connection point on one node to another node.
3. Release the mouse to create the connection.
4. Select the connection to edit its condition label and label position in the right properties panel.

Connection points support top, bottom, left, and right directions. When using the connection tool, start dragging from the direction you want to use.

### Edit a Connection

| Action | Description |
|---|---|
| Double-click connection text | Quickly edit the condition label |
| Click a connection | View and edit it in the right properties panel |
| Drag an endpoint | Reconnect to another node or port |
| Select and press `Delete` | Delete the connection |

### Routing Modes

Use the connection routing dropdown in the toolbar to switch modes:

| Mode | Description |
|---|---|
| Smooth curve | Good for simple diagrams |
| Orthogonal | Horizontal and vertical segments |
| Avoidance | Tries to route around nodes |
| Straight | Direct line between two points |
| Visio | Visio-like orthogonal routing with obstacle avoidance |

When lines cross, DiagramWeave shows a bridge marker at the crossing. The bridge means the lines pass over each other and are not connected.

## 5. Pan and Zoom

| Action | Description |
|---|---|
| Pan tool | Click the pan tool and drag to move the whole canvas view |
| `H` | Switch to the pan tool |
| Hold Space and drag | Temporarily pan the canvas |
| Middle mouse drag | Pan the canvas |
| Mouse wheel | Zoom |
| Toolbar `+` / `-` | Zoom in or out |
| Reset zoom | Return to 100% and reset the canvas position |

The pan tool moves the view only. It does not move nodes.

## 6. Table Editor

Click the table editor tool, or press `T`.

| Table | Purpose |
|---|---|
| Node table | Batch edit node ID, label, role, shape, details, duration, lane, and layer |
| Connection table | Batch edit source ID, target ID, and condition label |

Recommended workflow:

1. After editing on the canvas, click refresh to sync the canvas into the table.
2. After editing in the table, click apply to update the canvas.
3. To delete rows, click a row first so it is highlighted.

## 7. Save, Load, and Export

| Feature | Purpose |
|---|---|
| Save project | Export a `.diagramweave.json` file with node positions, connections, pages, and layers |
| Load project | Import a previously saved `.diagramweave.json` file |
| Save full Excel project | Export a `.diagramweave.xlsx` file that fully preserves pages, layers, positions, styles, ports, and routing |
| Load full Excel project | Restore a diagram from a `.diagramweave.xlsx` project file |
| Export PNG | Generate an image for documents or chat |
| Export SVG | Generate a vector file for Illustrator / Inkscape editing |
| Export PDF | Generate a file for printing or archiving |
| Excel template and import | Download an Excel template, import Excel into a diagram, or export the current diagram to Excel |

For long-running work, save a `.diagramweave.json` or `.diagramweave.xlsx` full project file first. Export PNG/SVG/PDF when you need to share or print. The regular Excel data table is useful for manually editing nodes and connections, but it does not preserve every canvas style or page state.

## 8. Templates

Click the workflow template button on the left side to open the template dialog.

The repository includes `starter-vertical.json`, a simple vertical starter flow. Applying a template replaces the current canvas, so save your current project first if needed.

To add a template:

1. Add a JSON template file under `templates/`.
2. Register the file name in `templates/index.json`.
3. Refresh the page, then choose it from the template dialog.

## 9. Pages and Layers

DiagramWeave supports multiple pages and layers.

| Feature | Description |
|---|---|
| Pages | Split a complex process into several pages |
| Layers | Group nodes for easier visibility and organization |
| Off-page nodes | Represent jumps to other pages |

Page names are used as default file names when saving or exporting. Use clear names for important pages.

## 10. Presentation Mode

Click the presentation button in the toolbar.

| Action | Description |
|---|---|
| Next | Move forward along the process connections |
| Previous | Go back to the previous step |
| `Esc` | Exit presentation mode |

Presentation mode highlights the current node and shows details, role, duration, and branch information in the side panel.

## 11. Language and Updates

| Feature | Location |
|---|---|
| Switch Chinese / English | Top language dropdown, or Settings |
| Sync content pack | Settings -> Sync content pack |
| Check for updates | Settings -> Check update |
| Open download page | Settings -> Open download page |

The content pack only updates icons, fonts, and connection mode configuration. Main application updates should still be delivered through GitHub Releases or Git.

## 12. Troubleshooting

### The page does not open

Install Node.js 18+, then start the project with `pnpm serve` or the launcher BAT.

### It says "pnpm / npm was not found"

Install the official Node.js LTS: <https://nodejs.org/>. If Node.js is already installed but npm is still missing, reinstall the official Node.js LTS, close the BAT window, and run it again.

### Windows blocks the BAT launcher

If double-clicking the BAT file shows "Smart App Control blocked a potentially unsafe file", the file was likely marked by Windows as downloaded from the Internet. See [`WINDOWS_START.md`](WINDOWS_START.md).

### Port 4173 is already in use

If the local service is already running, open:

<http://127.0.0.1:4173/flowchart-editor.html>

### Connections or assets do not load correctly

Do not open the HTML file with `file://`. Use the local HTTP service.

### Chinese text does not render correctly in PDF

The launcher syncs a Chinese font on first start. If PDF export still has font issues, rerun the launcher or run:

```bash
pnpm setup
```

### Excel import fails

Use the blank Excel template downloaded from the app. Do not rename column headers. Node IDs must be unique, and connection source/target IDs must exist in the node table.
