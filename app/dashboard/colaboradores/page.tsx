import Colaboradores from "@/components/ui/Colaboradores";
import DashboardHero from "@/components/ui/DashboardHero";

export default function Page() {
    return (
        <div>
            <DashboardHero
                prefijo="Ecosistema de"
                titulo="Proximidad."
                imagenFondo="/bg-colaboraciones.jpg"
                objectPosition="center 55%"
            />
            <Colaboradores variant="dashboard" />
        </div>
    );
}