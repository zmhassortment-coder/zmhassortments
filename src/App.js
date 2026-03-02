import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Homepage from "./App/User/js/Homepage";
import Shop from "./App/User/js/Product";
import About from "./App/User/js/Aboutus";
import Contact from "./App/User/js/Contact";
import Interiors from "./App/User/js/Interiors";
import Cart from "./App/User/js/Cart";
import Profile from "./App/User/js/Profile";
import Login from "./App/User/js/Login";
import SignUp from "./App/User/js/Signup";
import NotFound from "./App/User/js/NotFound";
import AdminLogin from "./App/Admin/merchant/Login";
import AdminSignup from "./App/Admin/merchant/Signup";
import AdminDashboard from "./App/Admin/Dashboard";
import GetProduct from "./App/Admin/product/GetProducts";
import CreateProduct from "./App/Admin/product/AddProduct";
import EditProduct from "./App/Admin/product/EditProduct";
import GetCategory from "./App/Admin/category/GetCategory";
import CategoryManagement from "./App/Admin/category/AddCategory";
import EditCategoryPage from "./App/Admin/category/EditCategory";
import GetBanner from "./App/Admin/banner/GetBanners";
import BannerManagement from "./App/Admin/banner/AddBanner";
import EditBanner from "./App/Admin/banner/EditBanner";
import GetMerchant from "./App/Admin/merchant/GetMerchant";
import GetOrders from "./App/Admin/order/GetOrders";
import DeliverySettings from "./App/Admin/settings/DeliverySettings";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/interiors" element={<Interiors />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/zmh" element={<AdminLogin />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/merchants" element={<GetMerchant />} />
          <Route path="/create-product" element={<CreateProduct />} />
          <Route path="/getproduct" element={<GetProduct />} />
          <Route path="/edit-product/:id" element={<EditProduct />} />
          <Route path="/create-categories" element={<CategoryManagement />} />
          <Route path="/getcategories" element={<GetCategory />} />
          <Route path="/edit-category/:id" element={<EditCategoryPage />} />
          <Route path="/create-banners" element={<BannerManagement />} />
          <Route path="/getbanners" element={<GetBanner />} />
          <Route path="/edit-banner/:id" element={<EditBanner />} />
          <Route path="/admin-orders" element={<GetOrders />} />
          <Route path="/admin-delivery-settings" element={<DeliverySettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
