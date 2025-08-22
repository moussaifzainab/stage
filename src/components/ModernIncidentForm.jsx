// Exemple d’utilisation
import ModernIncidentForm from "../components/ModernIncidentForm";

export default function AjoutIncidentPage() {
  return (
    <ModernIncidentForm onSuccess={() => {
      // rafraîchir la liste, rediriger, etc.
      // navigate("/incidents")
    }}/>
  );
}
