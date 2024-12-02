import axios from "axios";
import classNames from "classnames";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";

const fields = [
  "show_products",
  "gender",
  "age",
  "device_platform",
  "publisher_platform",
  "platform_position",
  "impression_device",
  "relationship",
  "behavior",
];

const constraints = {
  facebook: {
    show_products: [],
    gender: ["age"],
    age: ["gender"],
    impression_device: ["device_platform", "publisher_platform"],
    device_platform: ["impression_device", "publisher_platform"],
    publisher_platform: [
      "impression_device",
      "device_platform",
      "platform_position",
    ],
    platform_position: ["publisher_platform", "impression_device"],
  },
  instagram: {
    show_products: [],
    gender: ["age"],
    age: ["gender"],
    impression_device: ["device_platform", "publisher_platform"],
    device_platform: ["impression_device", "publisher_platform"],
    publisher_platform: [
      "impression_device",
      "device_platform",
      "platform_position",
    ],
    platform_position: ["publisher_platform", "impression_device"],
  },
  google: {
    gender: ["age"],
    age: ["gender"],
    impression_device: ["device_platform", "publisher_platform"],
    device_platform: ["impression_device", "publisher_platform"],
    publisher_platform: [
      "impression_device",
      "device_platform",
      "platform_position",
    ],
    platform_position: ["publisher_platform", "impression_device"],
    relationship: [],
  },
  linkedIn: {
    gender: ["age"],
    age: ["gender"],
    impression_device: ["device_platform", "publisher_platform"],
    device_platform: ["impression_device", "publisher_platform"],
    publisher_platform: [
      "impression_device",
      "device_platform",
      "platform_position",
    ],
    platform_position: ["publisher_platform", "impression_device"],
    behavior: [],
  },
};

const initialForm = {
  date_range: "maximum",
  organization: "all",
  source: "all",
  brand: "all",
  campaign_type: "all",
  delivery_type: "all",
  channel: "facebook",
  show_products: "hide",
  gender: "",
  age: "",
  device_platform: "",
  publisher_platform: "",
  platform_position: "",
  impression_device: "",
  asset: null,
};

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [enabledFields, setEnabledFields] = useState(fields);
  const [metrics, setMetrics] = useState(null);
  const [assets, setAssets] = useState(null);
  const [products, setProducts] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const res = await axios.get(
        "http://localhost:3004/api/analytics/unique/organizations"
      );

      setOrganizations(res.data || []);
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const data = Object.fromEntries(
        Object.entries({
          organization: form.organization,
          source: form.source,
          brand: form.brand,
          campaign_type: form.campaign_type,
          delivery_type: form.delivery_type,
          channel: form.channel,
        }).filter(([_, value]) => value !== "all")
      );

      const { start_date, end_date } = generateStartAndEndDates(
        form.date_range
      );

      const res = await axios.get(
        "http://localhost:3004/api/analytics/unique/campaigns",
        {
          params: {
            ...data,
            start_date,
            end_date,
          },
        }
      );

      setCampaigns(res.data || []);
    };

    fetchAll();
  }, [
    form.brand,
    form.campaign_type,
    form.channel,
    form.date_range,
    form.delivery_type,
    form.organization,
    form.source,
  ]);

  const generateStartAndEndDates = (date_range) => {
    let startDate;
    let endDate;

    switch (date_range) {
      case "today":
        startDate = moment().startOf("day");
        endDate = moment().endOf("day");
        break;
      case "this_week":
        startDate = moment().startOf("week");
        endDate = moment().endOf("week");
        break;
      case "last_week":
        startDate = moment().subtract(1, "week").startOf("week");
        endDate = moment().subtract(1, "week").endOf("week");
        break;
      case "last_month":
        startDate = moment().subtract(1, "month").startOf("month");
        endDate = moment().subtract(1, "month").endOf("month");
        break;
      case "last_year":
        startDate = moment().subtract(1, "year").startOf("year");
        endDate = moment().subtract(1, "year").endOf("year");
        break;
      case "maximum":
        startDate = moment().subtract(10, "years");
        endDate = moment();
        break;
      default:
        // Handle unknown or default case
        return;
    }

    // Format dates once
    const formattedStartDate = startDate.format("YYYY-MM-DD");
    const formattedEndDate = endDate.format("YYYY-MM-DD");

    return { start_date: formattedStartDate, end_date: formattedEndDate };
  };

  const fetchAssets = useCallback(async () => {
    if (!form.age && !form.gender) return;

    const data = Object.fromEntries(
      Object.entries(form).filter(([_, value]) => value !== "all")
    );

    const { start_date, end_date } = generateStartAndEndDates(form.date_range);

    const res = await axios.post(
      "http://localhost:3004/api/analytics/metrics",
      {
        ...data,
        fetch_assets: true,
        show_products: "hide",
        start_date,
        end_date,
      }
    );

    setAssets(res?.data || null);
    setMetrics(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.age, form.gender]);

  const fetchProducts = useCallback(async () => {
    if (form.show_products === "show") {
      const data = Object.fromEntries(
        Object.entries(form).filter(([_, value]) => value !== "all")
      );

      const { start_date, end_date } = generateStartAndEndDates(
        form.date_range
      );

      const res = await axios.post(
        "http://localhost:3004/api/analytics/metrics",
        { ...data, start_date, end_date }
      );

      setProducts(res?.data || null);
      setMetrics(null);
    } else {
      setProducts(null);
      setMetrics(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.show_products]);

  useEffect(() => {
    fetchAssets();
  }, [form.gender, form.age, fetchAssets]);

  useEffect(() => {
    fetchProducts();
  }, [form.show_products, fetchProducts]);

  useEffect(() => {
    const newEnabledFields = [];

    for (const fields in constraints["facebook"]) {
      newEnabledFields.push(fields);
    }

    setEnabledFields(newEnabledFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAssets(null);
    setProducts(null);
    setMetrics(null);
  }, [
    form.date_range,
    form.source,
    form.brand,
    form.campaign_type,
    form.delivery_type,
  ]);

  // console.log({ enabledFields });
  const handleFieldSelect = (e, isApplyEnableDisable = false) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      asset: null,
    }));
    setMetrics(null);

    if (!isApplyEnableDisable) return;

    const newEnabledFields = [];

    if (name in constraints[form.channel]) {
      newEnabledFields.push(...constraints[form.channel][name], name);
    }

    setEnabledFields(newEnabledFields);
  };

  const handleChannel = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    const newEnabledFields = [];

    for (const field in constraints[value]) {
      newEnabledFields.push(field);
    }

    setEnabledFields(newEnabledFields);
    setAssets(null);
    setProducts(null);
    setMetrics(null);
  };

  const handleSelectAsset = (type, id) => {
    setForm((prev) => ({
      ...prev,
      asset: {
        type,
        id,
      },
    }));
  };

  const handleReset = () => {
    setForm(initialForm);
    setEnabledFields(fields);
    setAssets(null);
    setProducts(null);
    setMetrics(null);
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(
      Object.entries(form).filter(([_, value]) => value !== "all")
    );

    const { start_date, end_date } = generateStartAndEndDates(form.date_range);

    const res = await axios.post(
      "http://localhost:3004/api/analytics/metrics",
      { ...data, show_products: "hide", start_date, end_date }
    );

    setMetrics(res?.data);
  };

  return (
    <div className="w-full bg-white">
      <form className="flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex flex-col gap-5 h-[100vh] overflow-y-auto p-6">
            <h1 className="font-semibold">Breakdown 1</h1>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date range
              </label>
              <select
                id="date_range"
                name="date_range"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                <option value="maximum">Maximum</option>
                <option value="today">Today</option>
                <option value="this_week">This week</option>
                <option value="last_week">Last week</option>
                <option value="last_month">Last month</option>
                <option value="last_year">Last year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <select
                id="organization"
                name="organization"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                <option value="all">All</option>
                {organizations?.map((org) => (
                  <option value={org} key={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Source
              </label>
              <select
                id="source"
                name="source"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                <option value="all">All</option>
                <option value="ADXL">ADXL</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <select
                id="brand"
                name="brand"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                <option value="all">All</option>
                <option value="1234">Hangry</option>
                <option value="Arti">Arti</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign type
              </label>
              <select
                id="campaign_type"
                name="campaign_type"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                <option value="all">All</option>
                <option value="traffic">Traffic</option>
                <option value="conversions">Conversions</option>
                <option value="instant_leads">Instant Leads</option>
                <option value="shopping">Shopping</option>
                <option value="messaging">Messaging</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery Type
              </label>
              <select
                id="delivery_type"
                name="delivery_type"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                {/* <option hidden>-- select --</option> */}
                <option value="all">All</option>
                <option value="ADXL Delivery">ADXL Delivery</option>
                <option value="Own Account Delivery">
                  Own Account Delivery
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Channel
              </label>
              <select
                id="channel"
                name="channel"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleChannel(e)}
              >
                {/* <option hidden>-- select --</option> */}
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="linkedIn">LinkedIn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign
              </label>
              <select
                id="source"
                name="source"
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={(e) => handleFieldSelect(e)}
              >
                <option value="all">All</option>
                {campaigns?.map((campaign) => (
                  <option value={campaign} key={campaign}>
                    {campaign}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-5 h-[100vh] overflow-y-auto p-6">
            <h1 className="font-semibold">Breakdown 2</h1>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Show products
              </label>
              <select
                id="show_products"
                name="show_products"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("show_products")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("show_products")}
              >
                <option value="hide">Hide</option>
                <option value="show">Show</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("gender") ? "bg-gray-300" : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("gender")}
              >
                <option hidden>-- select --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age
              </label>
              <select
                id="age"
                name="age"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("age") ? "bg-gray-300" : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("age")}
              >
                <option hidden>-- select --</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55-64">55-64</option>
                <option value="65+">65+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Publisher Platform
              </label>
              <select
                id="publisher_platform"
                name="publisher_platform"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("publisher_platform")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("publisher_platform")}
              >
                <option hidden>-- select --</option>
                <option value="audience_network">Audience Network</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="messenger">Messenger</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Device Platform
              </label>
              <select
                id="device_platform"
                name="device_platform"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("device_platform")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("device_platform")}
              >
                <option hidden>-- select --</option>
                <option value="desktop">Desktop</option>
                <option value="mobile_app">Mobile App</option>
                <option value="mobile_web">Mobile Web</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Platform Position
              </label>
              <select
                id="platform_position"
                name="platform_position"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("platform_position")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("platform_position")}
              >
                <option hidden>-- select --</option>
                <option value="an_classic">An classic</option>
                <option value="rewarded_video">Rewarded video</option>
                <option value="facebook_reels">Facebook reels</option>
                <option value="facebook_stories">Facebook stories</option>
                <option value="feed">Feed</option>
                <option value="instant_article">Instant article</option>
                <option value="instream_video">Instream video</option>
                <option value="marketplace">Marketplace</option>
                <option value="right_hand_column">Right hand column</option>
                <option value="video_feeds">Video feeds</option>
                <option value="instagram_explore">Instagram explore</option>
                <option value="instagram_reels">Instagram reels</option>
                <option value="instagram_stories">Instagram stories</option>
                <option value="messenger_inbox">Messenger inbox</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Impression Device
              </label>
              <select
                id="impression_device"
                name="impression_device"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("impression_device")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("impression_device")}
              >
                <option hidden>-- select --</option>
                <option value="android_smartphone">Android smartphone</option>
                <option value="android_tablet">Android tablet</option>
                <option value="desktop">Desktop</option>
                <option value="ipad">iPad</option>
                <option value="iphone">iPhone</option>
                <option value="ipod">iPod</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Family and Relationships
              </label>
              <select
                id="relationship"
                name="relationship"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("relationship")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("relationship")}
              >
                <option hidden>-- select --</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Behavior
              </label>
              <select
                id="behavior"
                name="behavior"
                className={classNames(
                  "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer",
                  !enabledFields.includes("behavior")
                    ? "bg-gray-300"
                    : "bg-white"
                )}
                onChange={(e) => handleFieldSelect(e, true)}
                disabled={!enabledFields.includes("behavior")}
              >
                <option hidden>-- select --</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-5 h-[100vh] overflow-y-auto p-6">
            <h1 className="font-semibold">Breakdown 3</h1>
            <div className="flex flex-col gap-5">
              {products?.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold">Products</h2>
                  <div className="flex flex-wrap w-full gap-3">
                    {products?.map((product) => (
                      <div
                        key={product?._id}
                        className={classNames(
                          "flex flex-col gap-2 w-[150px] rounded-xl cursor-pointer border-2 hover:border-blue-600 hover:border-2",
                          form?.asset?.id === product?._id
                            ? "border-blue-600"
                            : ""
                        )}
                        rel="noreferrer"
                      >
                        <img
                          src={product?.image_url}
                          alt={product?.name}
                          className="w-full h-[150px] object-cover rounded-xl"
                          onClick={() =>
                            handleSelectAsset("product_id", product?._id)
                          }
                        />
                        <div className="flex flex-col gap-2 p-3">
                          <h1 className="text-sm font-medium">
                            {product?.name}
                          </h1>
                          <div className="flex gap-2 justify-between items-center">
                            <h1 className="text-sm font-medium">
                              {product?.price}
                            </h1>
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-500 font-medium"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {assets?.filter((asset) => asset.type === "image_asset")?.length >
                0 && (
                <>
                  <h2 className="text-sm font-semibold">Image assets</h2>
                  <div className="flex flex-wrap w-full gap-2">
                    {assets
                      ?.filter((asset) => asset.type === "image_asset")
                      ?.map((asset) => (
                        <img
                          src={asset?.value?.url}
                          key={asset?._id}
                          alt={asset?.value?.name}
                          className={classNames(
                            "w-[100px] h-[100px] object-cover rounded-xl cursor-pointer hover:border-blue-600 hover:border-4",
                            form?.asset?.id === asset?.value?.id
                              ? "border-blue-600 border-4"
                              : ""
                          )}
                          onClick={() =>
                            handleSelectAsset("image_asset", asset?.value?.id)
                          }
                        />
                      ))}
                  </div>
                </>
              )}

              {assets?.filter((asset) => asset.type === "video_asset")?.length >
                0 && (
                <>
                  <h2 className="text-sm font-semibold">Video assets</h2>
                  <div className="flex flex-wrap w-full gap-2">
                    {assets
                      ?.filter((asset) => asset.type === "video_asset")
                      ?.map((asset) => (
                        <div
                          key={asset?._id}
                          className={classNames(
                            "w-full p-4 border-2 break-words rounded-xl cursor-pointer hover:border-blue-600 hover:border-2",
                            form?.asset?.id === asset?.value?.id
                              ? "border-blue-600 border-2"
                              : ""
                          )}
                          onClick={() =>
                            handleSelectAsset("video_asset", asset?.value?.id)
                          }
                        >
                          {JSON.stringify(asset?.value)}
                        </div>
                      ))}
                  </div>
                </>
              )}

              {assets?.filter((asset) => asset.type === "body_asset")?.length >
                0 && (
                <>
                  <h2 className="text-sm font-semibold">Body assets</h2>
                  <div className="flex flex-wrap w-full gap-2">
                    {assets
                      ?.filter((asset) => asset.type === "body_asset")
                      ?.map((asset) => (
                        <div
                          key={asset?._id}
                          className={classNames(
                            "w-full p-4 border-2 rounded-xl cursor-pointer hover:border-blue-600 hover:border-2",
                            form?.asset?.id === asset?.value?.id
                              ? "border-blue-600 border-2"
                              : ""
                          )}
                          onClick={() =>
                            handleSelectAsset("body_asset", asset?.value?.id)
                          }
                        >
                          {asset?.value?.text}
                        </div>
                      ))}
                  </div>
                </>
              )}

              {assets?.filter((asset) => asset.type === "title_asset")?.length >
                0 && (
                <>
                  <h2 className="text-sm font-semibold">Title assets</h2>
                  <div className="flex flex-wrap w-full gap-2">
                    {assets
                      ?.filter((asset) => asset.type === "title_asset")
                      ?.map((asset) => (
                        <div
                          key={asset?._id}
                          className={classNames(
                            "w-full p-4 border-2 rounded-xl cursor-pointer hover:border-blue-600 hover:border-2",
                            form?.asset?.id === asset?.value?.id
                              ? "border-blue-600 border-2"
                              : ""
                          )}
                          onClick={() =>
                            handleSelectAsset("title_asset", asset?.value?.id)
                          }
                        >
                          {asset?.value?.text}
                        </div>
                      ))}
                  </div>
                </>
              )}

              {assets?.filter(
                (asset) =>
                  asset.type === "description_asset" && asset?.value?.text
              )?.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold">Description assets</h2>
                  <div className="flex flex-wrap w-full gap-2">
                    {assets
                      ?.filter((asset) => asset.type === "description_asset")
                      ?.map(
                        (asset) =>
                          asset?.value?.text && (
                            <div
                              key={asset?._id}
                              className={classNames(
                                "w-full p-4 border-2 rounded-xl cursor-pointer hover:border-blue-600 hover:border-2",
                                form?.asset?.id === asset?.value?.id
                                  ? "border-blue-600 border-2"
                                  : ""
                              )}
                              onClick={() =>
                                handleSelectAsset(
                                  "description_asset",
                                  asset?.value?.id
                                )
                              }
                            >
                              {asset?.value?.text}
                            </div>
                          )
                      )}
                  </div>
                </>
              )}

              {assets?.filter(
                (asset) => asset.type === "product_id" && asset?.value?.text
              )?.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold">Description assets</h2>
                  <div className="flex flex-wrap w-full gap-2">
                    {assets
                      ?.filter((asset) => asset.type === "product_id")
                      ?.map(
                        (asset) =>
                          asset?.value?.text && (
                            <div
                              key={asset?._id}
                              className={classNames(
                                "w-full p-4 border-2 rounded-xl cursor-pointer hover:border-blue-600 hover:border-2",
                                form?.asset?.id === asset?.value?.id
                                  ? "border-blue-600 border-2"
                                  : ""
                              )}
                              onClick={() =>
                                handleSelectAsset(
                                  "description_asset",
                                  asset?.value?.id
                                )
                              }
                            >
                              {asset?.value?.text}
                            </div>
                          )
                      )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-5 h-[100vh] overflow-y-auto p-6">
            <div className="flex flex-col gap-5 h-[92000vh] overflow-y-auto p-6">
              <h1 className="font-semibold">Metrics</h1>
              {metrics && (
                <div className="flex flex-col gap-4">
                  {Object.keys(metrics).map((section) => {
                    const sectionData = metrics[section];
                    return (
                      <div className="flex flex-col gap-2" key={section}>
                        <h2 className="text-sm font-semibold">
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                        </h2>
                        {sectionData ? (
                          <table className="text-sm border border-gray-200 table-auto">
                            <tbody>
                              {Object.entries(sectionData).map(
                                ([key, value]) => (
                                  <tr key={key}>
                                    <td className="border px-3 py-1 w-[200px]">
                                      {key}
                                    </td>
                                    <td className="px-3 py-1 border">
                                      {value}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-sm text-gray-500">No records</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 h-[8vh]">
              <button
                className="h-10 px-10 bg-gray-200 rounded hover:bg-gray-300"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="h-10 px-10 text-white bg-blue-500 rounded hover:bg-blue-700"
                onClick={handleFilter}
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Home;
