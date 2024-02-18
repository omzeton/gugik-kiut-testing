import "./App.css";
import proj4 from "proj4";
import { useCallback, useRef, useState } from "react";
import Map, { MapRef } from "react-map-gl";

/*
Check lista:
✅ Warszawa 
❌ Łódź
✅ Kraków
✅ Rzeszów
✅ Wrocław
*/

type LoadingStatus = "idle" | "loading";

proj4.defs(
  "EPSG:2180",
  "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

const mapDim = {
  width: 800,
  height: 600,
};

function App() {
  const [image, setImage] = useState("");
  const [WMSStatus, setWMSStatus] = useState<LoadingStatus>("idle");

  const mapRef = useRef<MapRef>();
  const mapRefCallback = useCallback((node: MapRef | null) => {
    if (node) {
      mapRef.current = node;
    }
  }, []);

  const getBoundsIn2180 = () => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const sw = proj4("EPSG:4326", "EPSG:2180", [bounds.getWest(), bounds.getSouth()]);
      const ne = proj4("EPSG:4326", "EPSG:2180", [bounds.getEast(), bounds.getNorth()]);
      return [sw[1], sw[0], ne[1], ne[0]].join(",");
    }
    return "";
  };

  const getWMSLink = async () => {
    const layers = [
      // "gesut",
      // "kgesut_dane",
      // "przewod_urzadzenia",
      // "przewod_specjalny",
      // "przewod_niezidentyfikowany",
      "przewod_elektroenergetyczny",
      "przewod_telekomunikacyjny",
      "przewod_gazowy",
      "przewod_cieplowniczy",
      // "przewod_kanalizacyjny",
      // "przewod_wodociagowy",
    ].join(",");
    const params = new URLSearchParams({
      request: "GetMap",
      format: "image/png",
      version: "1.3.0",
      layers,
      styles: ",,,,,,,,,,",
      exceptions: "xml",
      crs: "EPSG:2180",
      width: mapDim.width.toString(),
      height: mapDim.height.toString(),
      service: "WMS",
      bbox: getBoundsIn2180(),
      transparent: "true",
    });

    // default
    // const path = `https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu?${params.toString()}`;

    // Rzeszów
    // const path = `https://integracja01.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu_18?${params.toString()}`;

    // Warszawa
    // const path = `https://wms.um.warszawa.pl/serwis?${params.toString()}`;

    // CORS Proxy
    // const path = `http://localhost:3000/https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu?${params.toString()}`;

    const path = `http://localhost:3000/https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu?${params.toString()}`;

    try {
      const response = await fetch(path);
      const reader = response.body?.getReader();
      const readableStream = new ReadableStream({
        start(controller) {
          return pump();
          function pump() {
            return reader!.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
        },
      });
      const newRes = new Response(readableStream);
      const blob = await newRes.blob();
      const url = URL.createObjectURL(blob);
      console.log(url);
      setImage(url);
      setWMSStatus("idle");
    } catch (err) {
      setWMSStatus("idle");
      console.log(err);
    }
  };

  return (
    <div className="container">
      <div className="mapbox-container" style={{ width: `${mapDim.width}px`, height: `${mapDim.height}px` }}>
        <div className="image-container" style={{ width: `${mapDim.width}px`, height: `${mapDim.height}px` }}>
          <img src={image} />
        </div>
        <Map
          ref={mapRefCallback}
          initialViewState={{ longitude: 17.0326, latitude: 51.1081, zoom: 17.88 }}
          style={mapDim}
          mapStyle="mapbox://styles/mapbox/streets-v9"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          onLoad={() => {
            setWMSStatus("loading");
            getWMSLink();
          }}
          onZoomStart={() => {
            setImage("");
          }}
          onMoveEnd={() => {
            setWMSStatus("loading");
            getWMSLink();
          }}
          onMoveStart={() => {
            setImage("");
          }}
        />
      </div>
      <div>{WMSStatus === "loading" && <p>Wczytywanie WMS...</p>}</div>
    </div>
  );
}

export default App;
