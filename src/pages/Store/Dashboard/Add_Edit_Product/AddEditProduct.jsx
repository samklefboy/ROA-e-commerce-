import { useState } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";
import FormCreation from "../../../../components/forms/FormCreation";

export default function AddEditProduct() {
  const [formData, setFormData] = useState({
    type: "REGULAR",

    //step 2
    name: "",
    description: "",
    condition: "",
    keywords: [],

    //step 3
    //  category: "",
    // gender: "",
    //brand: "",
    //origin: "",
    //isOrganic: false,
    //warrantyDuration: "",
    //deliveryOptions: [],
    //deliveryTime: "",

    //step 3b car
    //listingMeta: {
    //   location: "",

    //vehicle fields
    //  make: "",
    // model: "",
    //year: "",
    //mileage: "",
    //transmission: "",
    //fuel: "",
    //color: "",
    //bodyType: "",
    //  features: [],
    //   negotiable: false,
    //      contactMethod: [],

    //property fields
    //      listingType: "",
    //     propertyType: "",
    //      bedrooms: "",
    //   bathrooms: 1,
    // toilets: 1,
    // furnished: "",
    // floor: "",
    // sizeInSqm: "",
    // amenities: [],
    // address: "",
    // hideExactAddress: false,
    // agencyFee: "",
    // cautionFee: "",
    // },

    //step 4
    variants: {},
    productVariants: [],
    hasVariants: false,

    //step 5
    price: "",
    oldPrice: "",
    costPrice: "",
    stock: "",
    lowStockAlert: 5,
    sku: "",
    priceDisplay: "Show exact price",

    //step 6
    images: [],

    //step 7
    status: "ACTIVE",
  });
  const { id } = useParams();
  const isEditMode = Boolean(id);

  return (
    <section>
      <FormCreation
        formData={formData}
        setFormData={setFormData}
        getStore={false}
        isEditMode={isEditMode}
        title={isEditMode ? "Edit Product" : "Add Product"}
      />
    </section>
  );
}
