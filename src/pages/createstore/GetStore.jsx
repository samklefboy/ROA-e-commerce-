import { useState } from "react";
import MainHeader from "../../components/MainHeader";
import { HeroSection } from "../../pages/createstore/components/HeroSection";
import FormCreation from "../../components/forms/FormCreation";

export default function GetStore() {
  const [create, setCreate] = useState(false);

  const [storeData, setStoreData] = useState({
    Name: "",
    Slug: "",
    Category: "",
    tagline: "",
    Handle: "",
    description: "",

    logo: null,
    logoPreview: "",
    banner: null,
    bannerPreview: "",

    country: "",
    address: "",
    phone: "",
    city: "",
    state: "",
    delivery: "",
  });

  return (
    <section>
      <MainHeader
        hamburger={false}
        showNotification={false}
        search={false}
        showSearchbtn={!true}
        showCart={!true}
        showAuth={!true}
        ownStore={true}
      />

      <HeroSection setCreate={setCreate} create={create} />

      <div>
        {create && (
          <>
            <FormCreation
              formData={storeData}
              setFormData={setStoreData}
              addProduct={false}
              getStore={true}
              title="Create your store"
            />
          </>
        )}{" "}
      </div>
    </section>
  );
}
