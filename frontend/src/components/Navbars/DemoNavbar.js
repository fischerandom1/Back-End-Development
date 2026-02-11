import React from "react";
import { Link } from "react-router-dom";
// JavaScript plugin that hides or shows a component based on your scroll
import Headroom from "headroom.js";
// reactstrap components
import {
  Button,
  UncontrolledCollapse,
  DropdownMenu,
  DropdownItem,
  DropdownToggle,
  UncontrolledDropdown,
  Media,
  NavbarBrand,
  Navbar,
  NavItem,
  NavLink,
  Nav,
  Container,
  Row,
  Col,
  UncontrolledTooltip,
} from "reactstrap";

import brandImage from "assets/img/brand/AStarLogo.png";

class DemoNavbar extends React.Component {
  componentDidMount() {
    let headroom = new Headroom(document.getElementById("navbar-main"));
    // initialise
    headroom.init();
  }
  state = {
    collapseClasses: "",
    collapseOpen: false,
  };

  onExiting = () => {
    this.setState({
      collapseClasses: "collapsing-out",
    });
  };

  onExited = () => {
    this.setState({
      collapseClasses: "",
    });
  };

  render() {
    return (
      <>
        <header className="header-global">
          <Navbar
            className="navbar-main navbar-transparent navbar-light headroom"
            expand="lg"
            id="navbar-main"
          >
            <Container>
              <NavbarBrand className="mr-lg-5 max-width-100" to="/" tag={Link}>
                <img alt="..." src={brandImage} />
              </NavbarBrand>
              <button className="navbar-toggler" id="navbar_global">
                <span className="navbar-toggler-icon" />
              </button>
              <UncontrolledCollapse
                toggler="#navbar_global"
                navbar
                className={this.state.collapseClasses}
                onExiting={this.onExiting}
                onExited={this.onExited}
              >
                <div className="navbar-collapse-header">
                  <Row>
                    <Col className="collapse-brand" xs="6">
                      <Link to="views/Index.js">
                        <img alt="..." src={brandImage} />
                      </Link>
                    </Col>
                    <Col className="collapse-close" xs="6">
                      <button className="navbar-toggler" id="navbar_global">
                        <span />
                        <span />
                      </button>
                    </Col>
                  </Row>
                </div>
                <Nav className="navbar-nav-hover align-items-lg-center" navbar>
                  {/* <UncontrolledDropdown nav>
                    <DropdownToggle nav>
                      <i className="ni ni-map-big d-lg-none mr-1" />
                      <span className="nav-link-inner--text">Prediction</span>
                    </DropdownToggle>
                    <DropdownMenu className="dropdown-menu-xl">
                      <div className="dropdown-menu-inner">
                        <Media
                          className="d-flex align-items-center"
                          tag={Link} // Use the Link component
                          to="/DefectDetection" // Specify the route path
                        >
                          <div className="icon icon-shape bg-gradient-success rounded-circle text-white">
                            <i className="ni ni-ungroup" />
                          </div>
                          <Media body className="ml-3">
                            <h6 className="heading text-primary mb-md-1">
                              Defect Detection
                            </h6>
                            <p className="description d-none d-md-inline-block mb-0">
                              Segmentation & Classification
                            </p>
                          </Media>
                        </Media>
                        <Media
                          className="d-flex align-items-center"
                          tag={Link} // Use the Link component
                          to="/OCR" // Specify the route path
                        >
                          <div className="icon icon-shape bg-gradient-primary rounded-circle text-white">
                            <i className="ni ni-caps-small" />
                          </div>
                          <Media body className="ml-3">
                            <h6 className="heading text-primary mb-md-1">
                              OCR
                            </h6>
                            <p className="description d-none d-md-inline-block mb-0">
                              Convert image to text
                            </p>
                          </Media>
                        </Media>
                      </div>
                    </DropdownMenu>
                  </UncontrolledDropdown> */}

                  <NavItem className="d-block ml-lg-4">
                    <Link to="/Models">
                      <div className="nav-link">
                        <span className="btn-inner--icon">
                          <i className="ni ni-calendar-grid-58 d-lg-none mr-1" />
                        </span>
                        <span className="nav-link-inner--text ">Models</span>
                      </div>
                    </Link>
                  </NavItem>

                  <NavItem className="d-block ml-lg-4">
                    <Link to="/History">
                      <div className="nav-link">
                        <span className="btn-inner--icon">
                          <i className="ni ni-calendar-grid-58 d-lg-none mr-1" />
                        </span>
                        <span className="nav-link-inner--text ">History</span>
                      </div>
                    </Link>
                  </NavItem>

                  <NavItem className="d-block ml-lg-4">
                    <Link to="/Analytics">
                      <div className="nav-link">
                        <span className="btn-inner--icon">
                          <i className="ni ni-calendar-grid-58 d-lg-none mr-1" />
                        </span>
                        <span className="nav-link-inner--text ">Analytics</span>
                      </div>
                    </Link>
                  </NavItem>
                </Nav>
              </UncontrolledCollapse>
            </Container>
          </Navbar>
        </header>
      </>
    );
  }
}

export default DemoNavbar;
