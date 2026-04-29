import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Map, Layers, Navigation, ZoomIn, Info, Leaf, MapPin, X, Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { mockFarmers } from '@/data/mockFarmers'
import type { Farmer } from '@/types'

/* Fix Leaflet default icon path in Vite */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const createFarmIcon = (status: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${status === 'active' ? '#40BBB9' : status === 'pending' ? '#f97316' : '#9ca3af'};
      border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="transform:rotate(45deg);color:white;font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;width:100%;height:100%">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  })

/* Mock farm polygons (approximate outlines around coordinates) */
function generatePolygon(center: [number, number], sizeHa: number): [number, number][] {
  const offsetDeg = Math.sqrt(sizeHa) * 0.003
  const [lat, lng] = center
  return [
    [lat + offsetDeg, lng - offsetDeg],
    [lat + offsetDeg, lng + offsetDeg],
    [lat - offsetDeg * 0.7, lng + offsetDeg * 1.2],
    [lat - offsetDeg, lng + offsetDeg * 0.3],
    [lat - offsetDeg * 0.8, lng - offsetDeg * 0.8],
  ]
}

/* Boundary drawing helper */
function BoundaryDrawer({ onAdd }: { onAdd: (pts: [number, number][]) => void }) {
  const [points, setPoints] = useState<[number, number][]>([])
  useMapEvents({
    click(e) {
      setPoints((prev) => {
        const next = [...prev, [e.latlng.lat, e.latlng.lng] as [number, number]]
        if (next.length >= 3) onAdd(next)
        return next
      })
    },
  })
  return points.length >= 3 ? (
    <Polygon positions={points} pathOptions={{ color: '#98CF59', fillColor: '#98CF59', fillOpacity: 0.25, weight: 2, dashArray: '6 4' }} />
  ) : null
}

const LAYER_OPTIONS = ['Street', 'Satellite', 'Terrain'] as const
type LayerType = typeof LAYER_OPTIONS[number]

const TILE_URLS: Record<LayerType, string> = {
  Street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  Satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  Terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
}

const STATUS_COLORS: Record<string, 'green' | 'orange' | 'gray'> = { active: 'green', pending: 'orange', inactive: 'gray' }

export default function MappingPage() {
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [layer, setLayer] = useState<LayerType>('Street')
  const [showPolygons, setShowPolygons] = useState(true)
  const [drawMode, setDrawMode] = useState(false)
  const [drawnBoundaries, setDrawnBoundaries] = useState<[number, number][][]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const mapRef = useRef(null)

  const farmersWithCoords = mockFarmers.filter((f) => f.coordinates)
  const filtered = farmersWithCoords.filter((f) => filter === 'all' || f.status === filter)

  const SA_CENTER: [number, number] = [-28.4793, 24.6727]

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter by status */}
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          {(['all', 'active', 'pending', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-2 text-xs font-semibold capitalize transition-colors',
                filter === s ? 'bg-[#40BBB9] text-white' : 'bg-white text-gray-400 hover:text-[#06192C]'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Layer toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Layers size={14} className="text-gray-400" />
          {LAYER_OPTIONS.map((l) => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                layer === l ? 'bg-[#06192C] text-white border-[#06192C]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#06192C]'
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowPolygons(!showPolygons)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            showPolygons ? 'bg-[#98CF59]/15 text-[#4a7a1e] border-[#98CF59]' : 'bg-white text-gray-500 border-gray-200'
          )}
        >
          <Leaf size={13} /> Farm Boundaries
        </button>

        <button
          onClick={() => setDrawMode(!drawMode)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            drawMode ? 'bg-[#40BBB9] text-white border-[#40BBB9]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#40BBB9]'
          )}
        >
          <Plus size={13} /> {drawMode ? 'Drawing... (click map)' : 'Draw Boundary'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-[500px]">
        {/* Map */}
        <div className="xl:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative" style={{ minHeight: 500 }}>
          <MapContainer
            ref={mapRef}
            center={SA_CENTER}
            zoom={6}
            style={{ width: '100%', height: '100%', minHeight: 500 }}
            className="z-0"
          >
            <TileLayer
              key={layer}
              url={TILE_URLS[layer]}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Farm boundary polygons */}
            {showPolygons && filtered.map((f) =>
              f.coordinates ? (
                <Polygon
                  key={`poly-${f.id}`}
                  positions={generatePolygon(f.coordinates, f.farmSize)}
                  pathOptions={{
                    color: f.status === 'active' ? '#40BBB9' : '#f97316',
                    fillColor: f.status === 'active' ? '#40BBB9' : '#f97316',
                    fillOpacity: 0.12,
                    weight: 1.5,
                  }}
                />
              ) : null
            )}

            {/* Farm markers */}
            {filtered.map((f) =>
              f.coordinates ? (
                <Marker
                  key={f.id}
                  position={f.coordinates}
                  icon={createFarmIcon(f.status)}
                  eventHandlers={{ click: () => setSelectedFarmer(f) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Montserrat, Arial, sans-serif', minWidth: 180 }}>
                      <p style={{ fontWeight: 700, color: '#06192C', marginBottom: 4 }}>{f.farmName}</p>
                      <p style={{ color: '#40BBB9', fontFamily: 'monospace', fontSize: 11, marginBottom: 6 }}>{f.farmerId}</p>
                      <p style={{ color: '#555', fontSize: 11, marginBottom: 2 }}>👤 {f.name}</p>
                      <p style={{ color: '#555', fontSize: 11, marginBottom: 2 }}>📍 {f.district}, {f.province}</p>
                      <p style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>🌿 {f.farmSize} {f.farmSizeUnit}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {f.cropTypes.map((c) => (
                          <span key={c} style={{ background: '#98CF5920', color: '#4a7a1e', fontSize: 10, padding: '2px 6px', borderRadius: 9999, fontWeight: 600 }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Drawn boundaries */}
            {drawnBoundaries.map((pts, i) => (
              <Polygon key={`drawn-${i}`} positions={pts}
                pathOptions={{ color: '#98CF59', fillColor: '#98CF59', fillOpacity: 0.2, weight: 2.5, dashArray: '6 4' }} />
            ))}

            {/* Drawing mode */}
            {drawMode && (
              <BoundaryDrawer onAdd={(pts) => {
                setDrawnBoundaries((prev) => [...prev, pts])
                setDrawMode(false)
              }} />
            )}
          </MapContainer>

          {/* Map overlay legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-gray-100 z-[1000]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Legend</p>
            <div className="flex flex-col gap-1.5">
              {[
                { color: '#40BBB9', label: 'Active Farm' },
                { color: '#f97316', label: 'Pending Farm' },
                { color: '#9ca3af', label: 'Inactive Farm' },
                { color: '#98CF59', label: 'Drawn Boundary' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
                  <span className="text-[10px] text-gray-600">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Farm count badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-gray-100 z-[1000]">
            <p className="text-xs font-bold text-[#06192C]">{filtered.length} farms</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px]">
          {/* Selected farm detail */}
          {selectedFarmer ? (
            <Card className="border-[#40BBB9]/30">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#06192C]">Selected Farm</p>
                <button onClick={() => setSelectedFarmer(null)} className="text-gray-400 hover:text-[#06192C] p-1 hover:bg-gray-100 rounded-lg">
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white font-bold text-sm">
                  {selectedFarmer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#06192C]">{selectedFarmer.name}</p>
                  <p className="text-[10px] font-mono text-[#40BBB9]">{selectedFarmer.farmerId}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Farm</span><span className="font-semibold">{selectedFarmer.farmName}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Size</span><span className="font-semibold">{selectedFarmer.farmSize} {selectedFarmer.farmSizeUnit}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Province</span><span className="font-semibold">{selectedFarmer.province}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400">Status</span><Badge variant={STATUS_COLORS[selectedFarmer.status]}>{selectedFarmer.status}</Badge></div>
                {selectedFarmer.lsmCategory && (
                  <div className="flex justify-between items-center"><span className="text-gray-400">LSM</span><Badge variant="blue">{selectedFarmer.lsmCategory}</Badge></div>
                )}
                <div className="flex justify-between"><span className="text-gray-400">Coordinates</span>
                  <span className="font-mono text-[10px] text-[#40BBB9]">
                    {selectedFarmer.coordinates?.[0].toFixed(4)}, {selectedFarmer.coordinates?.[1].toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {selectedFarmer.cropTypes.map((c) => (
                  <span key={c} className="text-[10px] bg-[#98CF59]/12 text-[#4a7a1e] px-2 py-0.5 rounded-full font-semibold">{c}</span>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-6">
              <Navigation size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-medium">Click a marker to view farm details</p>
            </Card>
          )}

          {/* Farm list */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-[#06192C]">Farm List</p>
            </div>
            <div className="flex flex-col divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFarmer(f)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F4F8F6] transition-colors w-full',
                    selectedFarmer?.id === f.id && 'bg-[#40BBB9]/8'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: f.status === 'active' ? '#40BBB9' : f.status === 'pending' ? '#f97316' : '#9ca3af' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#06192C] truncate">{f.farmName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{f.province} · {f.farmSize} {f.farmSizeUnit}</p>
                  </div>
                  <MapPin size={12} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card padding="sm">
            <p className="text-xs font-bold text-[#06192C] mb-3">Map Statistics</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Total Area', value: `${mockFarmers.reduce((s, f) => s + f.farmSize, 0).toLocaleString()} ha` },
                { label: 'Active Farms', value: mockFarmers.filter((f) => f.status === 'active').length },
                { label: 'Provinces', value: new Set(mockFarmers.map((f) => f.province)).size },
                { label: 'Drawn Boundaries', value: drawnBoundaries.length },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-gray-400">{s.label}</span>
                  <span className="font-bold text-[#06192C]">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
