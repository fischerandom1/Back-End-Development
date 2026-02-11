/*eslint-disable*/
import React from "react";
import { Link } from "react-router-dom";
// reactstrap components
import {
  Button,
  Card,
  CardImg,
  NavItem,
  NavLink,
  Nav,
  Container,
  Row,
  Col,
  UncontrolledTooltip,
} from "reactstrap";

class CardsFooter extends React.Component {
  render() {
    return (
      <>
        <footer className="footer has-cards">
          {/* <Container className="container-lg">
            <Row>
              <Col className="mb-5 mb-md-0" md="6">
                <Card className="card-lift--hover shadow border-0">
                  <Link to="/landing-page">
                    <CardImg
                      alt="..."
                      src={require("assets/img/theme/landing.jpg")}
                    />
                  </Link>
                </Card>
              </Col>
              <Col className="mb-5 mb-lg-0" md="6">
                <Card className="card-lift--hover shadow border-0">
                  <Link to="/profile-page">
                    <CardImg
                      alt="..."
                      src={require("assets/img/theme/profile.jpg")}
                    />
                  </Link>
                </Card>
              </Col>
            </Row>
          </Container> */}
          <Container>
            <footer className="footer">
              <Container>
                <Row className="row-grid mb-5">
                  <Col lg="8">
                    <h3 className="text-primary font-weight-light mb-2">
                      ARTC
                    </h3>
                    <p className="mb-0 font-weight-light">
                      The Advanced Remanufacturing and Technology Centre (ARTC)
                      is a contemporary platform built upon strong
                      public-private partnerships to translate research into
                      industry applications. It is led by the Agency for
                      Science, Technology, and Research (A*STAR), in partnership
                      with the Nanyang Technological University, Singapore (NTU
                      Singapore).
                    </p>
                  </Col>
                  <Col lg="2">
                    <h3 className="text-primary font-weight-light mb-2">
                      Address
                    </h3>
                    <p className="mb-0 font-weight-light">
                      3 Cleantech Loop, #01/01 CleanTech Two, Singapore 637143
                    </p>
                  </Col>
                  <Col lg="2">
                    <h3 className="text-primary font-weight-light mb-2">
                      Contact
                    </h3>
                    <p className="mb-0 font-weight-light">6908 7900</p>
                  </Col>
                </Row>
                <hr />
                <Row className="align-items-center justify-content-md-between">
                  <Col md="6">
                    <div className="copyright">Copyright © 2023 ARTC</div>
                  </Col>
                  <Col md="6">
                    <Nav className=" nav-footer justify-content-end">
                      <Col className="text-lg-center btn-wrapper" lg="6">
                        <Button
                          className="btn-icon-only rounded-circle"
                          color="twitter"
                          href="https://www.linkedin.com/company/astarsg/"
                          id="tooltip475038070"
                        >
                          <span className="btn-inner--icon">
                            <i className="fa fa-linkedin" />
                          </span>
                        </Button>
                        <UncontrolledTooltip
                          delay={0}
                          target="tooltip475038070"
                        >
                          Work with us
                        </UncontrolledTooltip>
                        <Button
                          className="btn-icon-only rounded-circle ml-1"
                          color="instagram"
                          href="https://www.instagram.com/astarsg/"
                          id="tooltip495507257"
                          target="_blank"
                        >
                          <span className="btn-inner--icon">
                            <i className="fa fa-instagram" />
                          </span>
                        </Button>
                        <UncontrolledTooltip
                          delay={0}
                          target="tooltip495507257"
                        >
                          Like us
                        </UncontrolledTooltip>
                        <Button
                          className="btn-icon-only rounded-circle ml-1"
                          color="facebook"
                          href="https://www.facebook.com/ASTARSG/"
                          id="tooltip837440414"
                        >
                          <span className="btn-inner--icon">
                            <i className="fa fa-facebook-square" />
                          </span>
                        </Button>
                        <UncontrolledTooltip
                          delay={0}
                          target="tooltip837440414"
                        >
                          Support us
                        </UncontrolledTooltip>
                        <Button
                          className="btn-icon-only rounded-circle"
                          color="twitter"
                          href="https://twitter.com/i/flow/login?redirect_after_login=%2Fastarsg"
                          id="tooltip475038074"
                        >
                          <span className="btn-inner--icon">
                            <i className="fa fa-twitter" />
                          </span>
                        </Button>
                        <UncontrolledTooltip
                          delay={0}
                          target="tooltip475038074"
                        >
                          Follow us
                        </UncontrolledTooltip>
                      </Col>
                    </Nav>
                  </Col>
                </Row>
              </Container>
            </footer>
          </Container>
        </footer>
      </>
    );
  }
}

export default CardsFooter;
