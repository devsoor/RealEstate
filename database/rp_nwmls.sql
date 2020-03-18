-- phpMyAdmin SQL Dump
-- version 4.7.6
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2018 at 06:35 PM
-- Server version: 10.1.29-MariaDB-1~jessie
-- PHP Version: 5.6.30-0+deb8u1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rp_nwmls`
--
CREATE DATABASE IF NOT EXISTS `rp_nwmls` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `rp_nwmls`;

DELIMITER $$
--
-- Functions
--
CREATE FUNCTION `GeoDistBothLonLatAsMiles` (`lon1` DOUBLE, `lat1` DOUBLE, `lon2` DOUBLE, `lat2` DOUBLE) RETURNS DOUBLE NO SQL
    DETERMINISTIC
BEGIN

DECLARE pi80, radius, dlat, dlon, a, c DOUBLE;
DECLARE miles DOUBLE DEFAULT 0;

SET pi80 = PI() / 180.0;
SET radius = 3959.0;

SET lat1 = lat1 * pi80;
SET lon1 = lon1 * pi80;
SET lat2 = lat2 * pi80;
SET lon2 = lon2 * pi80;

SET dlat = lat2 - lat1;
SET dlon = lon2 - lon1;

SET a = SIN(dlat / 2.0) * SIN(dlat / 2.0) + COS(lat1) * COS(lat2) * SIN(dlon / 2.0) * SIN(dlon / 2.0);
SET c = 2.0 * ATAN2(SQRT(a), SQRT(1 - a));

SET miles = c * radius;

RETURN miles;

END$$

CREATE FUNCTION `GeoDistLonLatGeoPosAsMiles` (`lon1` DOUBLE, `lat1` DOUBLE, `mpGeoPos` GEOMETRY) RETURNS DOUBLE NO SQL
    DETERMINISTIC
BEGIN

DECLARE pi80, radius, lon2, lat2, dlat, dlon, a, c DOUBLE;
DECLARE miles DOUBLE DEFAULT 0;

SET pi80 = PI() / 180.0;
SET radius = 3959.0;

SET lat1 = lat1 * pi80;
SET lon1 = lon1 * pi80;
SET lat2 = Y(mpGeoPos) * pi80;
SET lon2 = X(mpGeoPos) * pi80;

SET dlat = lat2 - lat1;
SET dlon = lon2 - lon1;

SET a = SIN(dlat / 2.0) * SIN(dlat / 2.0) + COS(lat1) * COS(lat2) * SIN(dlon / 2.0) * SIN(dlon / 2.0);
SET c = 2.0 * ATAN2(SQRT(a), SQRT(1 - a));

SET miles = c * radius;

RETURN miles;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `mpCOMI`
--

CREATE TABLE `mpCOMI` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `OLP` decimal(11,2) DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) DEFAULT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) DEFAULT NULL,
  `STA` char(2) NOT NULL,
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `ASF` int(10) UNSIGNED NOT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `DSRNUM` smallint(5) UNSIGNED DEFAULT NULL,
  `LDR` datetime DEFAULT NULL,
  `LD` datetime NOT NULL,
  `CLO` datetime DEFAULT NULL,
  `YBT` smallint(5) UNSIGNED NOT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) DEFAULT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `PDR` datetime DEFAULT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `DD` varchar(250) DEFAULT NULL,
  `AVDT` datetime DEFAULT NULL,
  `INDT` datetime DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `CTDT` datetime DEFAULT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `VIRT` varchar(200) DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `SDT` datetime NOT NULL,
  `FIN` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `AMP` smallint(1) UNSIGNED DEFAULT NULL,
  `AVP` smallint(4) UNSIGNED DEFAULT NULL,
  `BDC` char(1) DEFAULT NULL,
  `BLK` varchar(40) DEFAULT NULL,
  `CAP` decimal(5,2) DEFAULT NULL,
  `BON` char(1) DEFAULT NULL,
  `CHT` varchar(40) DEFAULT NULL,
  `CSP` varchar(40) DEFAULT NULL,
  `DLT` smallint(4) UNSIGNED DEFAULT NULL,
  `ELEX` smallint(4) UNSIGNED DEFAULT NULL,
  `ENV` char(1) DEFAULT NULL,
  `EXA` char(1) DEFAULT NULL,
  `EXP` int(6) UNSIGNED DEFAULT NULL,
  `F17` char(1) DEFAULT NULL,
  `FAC` char(1) DEFAULT NULL,
  `GAI` int(4) UNSIGNED DEFAULT NULL,
  `GRM` smallint(2) UNSIGNED DEFAULT NULL,
  `GSI` int(6) UNSIGNED DEFAULT NULL,
  `HET` smallint(4) UNSIGNED DEFAULT NULL,
  `HOD` smallint(5) UNSIGNED DEFAULT NULL,
  `INS` smallint(4) UNSIGNED DEFAULT NULL,
  `LSZ` varchar(40) DEFAULT NULL,
  `LT` varchar(40) DEFAULT NULL,
  `NNN` smallint(4) UNSIGNED DEFAULT NULL,
  `NOI` int(6) UNSIGNED DEFAULT NULL,
  `OSF` int(4) UNSIGNED DEFAULT NULL,
  `OTX` int(4) UNSIGNED DEFAULT NULL,
  `PAD` char(1) DEFAULT NULL,
  `PKC` smallint(4) UNSIGNED DEFAULT NULL,
  `PKU` smallint(4) UNSIGNED DEFAULT NULL,
  `POC` varchar(40) DEFAULT NULL,
  `PTO` char(1) DEFAULT NULL,
  `SIZ` int(4) UNSIGNED DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `STF` int(4) UNSIGNED DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `SWC` varchar(40) DEFAULT NULL,
  `TAV` int(6) UNSIGNED DEFAULT NULL,
  `TEX` int(6) UNSIGNED DEFAULT NULL,
  `TRI` int(4) UNSIGNED DEFAULT NULL,
  `TSF` int(4) UNSIGNED DEFAULT NULL,
  `TX` int(10) UNSIGNED DEFAULT NULL,
  `TXY` smallint(5) UNSIGNED DEFAULT NULL,
  `VAC` smallint(4) UNSIGNED DEFAULT NULL,
  `VAI` int(4) UNSIGNED DEFAULT NULL,
  `VAL` int(4) UNSIGNED DEFAULT NULL,
  `WAC` varchar(40) DEFAULT NULL,
  `WSF` int(4) UNSIGNED DEFAULT NULL,
  `WSG` int(4) UNSIGNED DEFAULT NULL,
  `YVA` smallint(4) UNSIGNED DEFAULT NULL,
  `ZJD` varchar(6) DEFAULT NULL,
  `CFE` varchar(18) DEFAULT NULL,
  `ENS` varchar(24) DEFAULT NULL,
  `EXT` varchar(30) DEFAULT NULL,
  `FLS` varchar(26) DEFAULT NULL,
  `FND` varchar(20) DEFAULT NULL,
  `GZC` varchar(26) DEFAULT NULL,
  `HTC` varchar(40) DEFAULT NULL,
  `LDG` varchar(20) DEFAULT NULL,
  `LTV` varchar(36) DEFAULT NULL,
  `POS` varchar(8) DEFAULT NULL,
  `RF` varchar(18) DEFAULT NULL,
  `SWR` varchar(14) DEFAULT NULL,
  `TRM` varchar(28) DEFAULT NULL,
  `WAS` varchar(40) DEFAULT NULL,
  `TN1` varchar(40) DEFAULT NULL,
  `SF1` int(4) UNSIGNED DEFAULT NULL,
  `RN1` int(4) UNSIGNED DEFAULT NULL,
  `LX1` datetime DEFAULT NULL,
  `NN1` int(4) UNSIGNED DEFAULT NULL,
  `US1` varchar(40) DEFAULT NULL,
  `TN2` varchar(40) DEFAULT NULL,
  `SF2` int(4) UNSIGNED DEFAULT NULL,
  `RN2` int(4) UNSIGNED DEFAULT NULL,
  `LX2` datetime DEFAULT NULL,
  `NN2` int(4) UNSIGNED DEFAULT NULL,
  `US2` varchar(40) DEFAULT NULL,
  `TN3` varchar(40) DEFAULT NULL,
  `SF3` int(4) UNSIGNED DEFAULT NULL,
  `RN3` int(4) UNSIGNED DEFAULT NULL,
  `LX3` datetime DEFAULT NULL,
  `NN3` int(4) UNSIGNED DEFAULT NULL,
  `US3` varchar(40) DEFAULT NULL,
  `TN4` varchar(40) DEFAULT NULL,
  `SF4` int(4) UNSIGNED DEFAULT NULL,
  `RN4` int(4) UNSIGNED DEFAULT NULL,
  `LX4` datetime DEFAULT NULL,
  `NN4` int(4) UNSIGNED DEFAULT NULL,
  `US4` varchar(40) DEFAULT NULL,
  `TN5` varchar(40) DEFAULT NULL,
  `SF5` int(4) UNSIGNED DEFAULT NULL,
  `RN5` int(4) UNSIGNED DEFAULT NULL,
  `LX5` datetime DEFAULT NULL,
  `NN5` int(4) UNSIGNED DEFAULT NULL,
  `US5` varchar(40) DEFAULT NULL,
  `TN6` varchar(40) DEFAULT NULL,
  `SF6` int(4) UNSIGNED DEFAULT NULL,
  `RN6` int(4) UNSIGNED DEFAULT NULL,
  `LX6` datetime DEFAULT NULL,
  `NN6` int(4) UNSIGNED DEFAULT NULL,
  `US6` varchar(40) DEFAULT NULL,
  `ProhibitBLOG` char(1) DEFAULT NULL,
  `AllowAVM` char(1) DEFAULT NULL,
  `PARQ` char(1) DEFAULT NULL,
  `BREO` char(1) DEFAULT NULL,
  `EPSEnergy` tinyint(3) UNSIGNED DEFAULT NULL,
  `ROFR` char(1) DEFAULT NULL,
  `HERSIndex` tinyint(3) UNSIGNED DEFAULT NULL,
  `LEEDRating` varchar(32) DEFAULT NULL,
  `NWESHRating` varchar(32) DEFAULT NULL,
  `ConstructionMethods` varchar(16) DEFAULT NULL,
  `Auction` char(1) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `EffectiveYearBuilt` smallint(5) UNSIGNED DEFAULT NULL,
  `EffectiveYearBuiltSource` char(2) DEFAULT NULL,
  `OFF` varchar(32) DEFAULT NULL,
  `OFFRD` date DEFAULT NULL,
  `SaleType` char(3) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCOMIimages`
--

CREATE TABLE `mpCOMIimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCOMIupdates`
--

CREATE TABLE `mpCOMIupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCOMIwp`
--

CREATE TABLE `mpCOMIwp` (
  `UniqueID` varchar(48) NOT NULL COMMENT 'Usually MLS_Vendor-MLS-LN',
  `MLS_Vendor` varchar(16) NOT NULL COMMENT 'MLS Vendor ID (e.g. NWMLS)',
  `LN` int(10) UNSIGNED NOT NULL COMMENT 'MLS Listing Number',
  `Status` char(1) NOT NULL COMMENT 'MLS Status of property (A,P,S)',
  `PropertyDate` datetime NOT NULL COMMENT 'Update Date for property when last updated from MLS',
  `WP_PostID` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'WordPress Post ID for property',
  `WP_Status` char(1) DEFAULT NULL COMMENT 'Status of property (A,P,S) when last updated in WP',
  `WP_PropertyDate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Update Date for property when last updated in WP',
  `WP_Modified` datetime DEFAULT NULL COMMENT 'Date/Time property was last modified in WP',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time this record was last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCOND`
--

CREATE TABLE `mpCOND` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `OLP` decimal(11,2) DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) DEFAULT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) DEFAULT NULL,
  `STA` char(2) NOT NULL,
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `BR` decimal(4,2) NOT NULL,
  `BTH` decimal(4,2) NOT NULL,
  `ASF` int(10) UNSIGNED NOT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `DSRNUM` smallint(5) UNSIGNED DEFAULT NULL,
  `LDR` datetime DEFAULT NULL,
  `LD` datetime NOT NULL,
  `CLO` datetime DEFAULT NULL,
  `YBT` smallint(5) UNSIGNED NOT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) DEFAULT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `PDR` datetime DEFAULT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `DD` varchar(250) DEFAULT NULL,
  `AVDT` datetime DEFAULT NULL,
  `INDT` datetime DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `CTDT` datetime DEFAULT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `VIRT` varchar(200) DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `SDT` datetime NOT NULL,
  `FIN` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `QBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `AFH` char(1) DEFAULT NULL,
  `ASC` varchar(50) DEFAULT NULL,
  `BDL` tinyint(3) UNSIGNED DEFAULT NULL,
  `BDM` tinyint(3) UNSIGNED DEFAULT NULL,
  `BDU` tinyint(3) UNSIGNED DEFAULT NULL,
  `BUS` char(1) DEFAULT NULL,
  `BRM` char(1) DEFAULT NULL,
  `COO` char(1) DEFAULT NULL,
  `DNO` char(1) DEFAULT NULL,
  `DRM` char(1) DEFAULT NULL,
  `EL` varchar(20) DEFAULT NULL,
  `F17` char(1) DEFAULT NULL,
  `FAM` char(1) DEFAULT NULL,
  `FBL` tinyint(3) UNSIGNED DEFAULT NULL,
  `ENT` char(1) DEFAULT NULL,
  `FBM` tinyint(3) UNSIGNED DEFAULT NULL,
  `FBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `FBU` tinyint(3) UNSIGNED DEFAULT NULL,
  `FP` tinyint(3) UNSIGNED DEFAULT NULL,
  `FPL` tinyint(3) UNSIGNED DEFAULT NULL,
  `FPM` tinyint(3) UNSIGNED DEFAULT NULL,
  `FPU` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBL` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBM` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBU` tinyint(3) UNSIGNED DEFAULT NULL,
  `HOD` smallint(5) UNSIGNED DEFAULT NULL,
  `JH` varchar(20) DEFAULT NULL,
  `KES` char(1) DEFAULT NULL,
  `KIT` char(1) DEFAULT NULL,
  `LRM` char(1) DEFAULT NULL,
  `LSD` varchar(40) DEFAULT NULL,
  `MBD` char(1) DEFAULT NULL,
  `MGR` varchar(50) DEFAULT NULL,
  `MOR` int(10) UNSIGNED DEFAULT NULL,
  `NAS` tinyint(2) UNSIGNED DEFAULT NULL,
  `NC` char(1) DEFAULT NULL,
  `NOC` smallint(3) UNSIGNED DEFAULT NULL,
  `NOS` smallint(2) UNSIGNED DEFAULT NULL,
  `NOU` tinyint(2) UNSIGNED DEFAULT NULL,
  `OOC` tinyint(3) UNSIGNED DEFAULT NULL,
  `PKS` varchar(16) DEFAULT NULL,
  `PRJ` varchar(50) DEFAULT NULL,
  `PTO` char(1) DEFAULT NULL,
  `TQBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `REM` char(1) DEFAULT NULL,
  `SAA` smallint(3) UNSIGNED DEFAULT NULL,
  `SFS` varchar(40) DEFAULT NULL,
  `SH` varchar(20) DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `SNR` char(1) DEFAULT NULL,
  `SPA` char(1) DEFAULT NULL,
  `STG` varchar(50) DEFAULT NULL,
  `STL` varchar(50) DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `TBL` tinyint(3) UNSIGNED DEFAULT NULL,
  `TBM` tinyint(3) UNSIGNED DEFAULT NULL,
  `TBU` tinyint(3) UNSIGNED DEFAULT NULL,
  `TOF` char(1) DEFAULT NULL,
  `TX` int(10) UNSIGNED DEFAULT NULL,
  `TXY` smallint(5) UNSIGNED DEFAULT NULL,
  `UFN` smallint(2) UNSIGNED DEFAULT NULL,
  `UTR` char(1) DEFAULT NULL,
  `WDW` varchar(16) DEFAULT NULL,
  `WHT` varchar(40) DEFAULT NULL,
  `APH` varchar(12) DEFAULT NULL,
  `APS` varchar(20) DEFAULT NULL,
  `CMN` varchar(100) DEFAULT NULL,
  `CTD` varchar(12) DEFAULT NULL,
  `ENS` varchar(24) DEFAULT NULL,
  `EXT` varchar(30) DEFAULT NULL,
  `FLS` varchar(26) DEFAULT NULL,
  `HOI` varchar(24) DEFAULT NULL,
  `HTC` varchar(40) DEFAULT NULL,
  `LDE` varchar(26) DEFAULT NULL,
  `PKG` varchar(20) DEFAULT NULL,
  `POS` varchar(8) DEFAULT NULL,
  `RF` varchar(18) DEFAULT NULL,
  `TRM` varchar(28) DEFAULT NULL,
  `UNF` varchar(34) DEFAULT NULL,
  `VEW` varchar(28) DEFAULT NULL,
  `WFT` varchar(36) DEFAULT NULL,
  `ARC` char(1) DEFAULT NULL,
  `BUSR` varchar(20) DEFAULT NULL,
  `ECRT` varchar(10) DEFAULT NULL,
  `STRS` tinyint(2) UNSIGNED DEFAULT NULL,
  `ProhibitBLOG` char(1) DEFAULT NULL,
  `AllowAVM` char(1) DEFAULT NULL,
  `PARQ` char(1) DEFAULT NULL,
  `BREO` char(1) DEFAULT NULL,
  `BuiltGreenRating` varchar(32) DEFAULT NULL,
  `EPSEnergy` tinyint(3) UNSIGNED DEFAULT NULL,
  `ROFR` char(1) DEFAULT NULL,
  `HERSIndex` tinyint(3) UNSIGNED DEFAULT NULL,
  `LEEDRating` varchar(32) DEFAULT NULL,
  `NewConstruction` char(1) DEFAULT NULL,
  `NWESHRating` varchar(32) DEFAULT NULL,
  `ConstructionMethods` varchar(16) DEFAULT NULL,
  `Auction` char(1) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `EffectiveYearBuilt` smallint(5) UNSIGNED DEFAULT NULL,
  `EffectiveYearBuiltSource` char(2) DEFAULT NULL,
  `OFF` varchar(32) DEFAULT NULL,
  `OFFRD` date DEFAULT NULL,
  `SaleType` char(3) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCONDimages`
--

CREATE TABLE `mpCONDimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCONDupdates`
--

CREATE TABLE `mpCONDupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpCONDwp`
--

CREATE TABLE `mpCONDwp` (
  `UniqueID` varchar(48) NOT NULL COMMENT 'Usually MLS_Vendor-MLS-LN',
  `MLS_Vendor` varchar(16) NOT NULL COMMENT 'MLS Vendor ID (e.g. NWMLS)',
  `LN` int(10) UNSIGNED NOT NULL COMMENT 'MLS Listing Number',
  `Status` char(1) NOT NULL COMMENT 'MLS Status of property (A,P,S)',
  `PropertyDate` datetime NOT NULL COMMENT 'Update Date for property when last updated from MLS',
  `CMA_CashFlow` float NOT NULL DEFAULT '0' COMMENT 'CMA Cash Flow',
  `CMA_CapRate` float NOT NULL DEFAULT '0' COMMENT 'CMA Cap Rate',
  `CMA_RentToValue` float NOT NULL DEFAULT '0' COMMENT 'CMA Rent-to-Value Ratio',
  `CMA_SuccessCriteria` varchar(22) DEFAULT NULL COMMENT 'CMA Success Criteria',
  `CMA_CriteriaThreshold` float NOT NULL DEFAULT '0' COMMENT 'CMA Criteria Threshold',
  `CMA_CriteriaResult` char(7) DEFAULT NULL COMMENT 'CMA Criteria Result',
  `CMA_MarketValue` float NOT NULL DEFAULT '0' COMMENT 'CMA Estimated Market Value',
  `CMA_Results` varchar(4000) DEFAULT NULL COMMENT 'CMA Results JSON',
  `CMA_Modified` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Date/Time CMA was last modified',
  `WP_PostID` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'WordPress Post ID for property',
  `WP_Status` char(1) DEFAULT NULL COMMENT 'Status of property (A,P,S) when last updated in WP',
  `WP_PropertyDate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Update Date for property when last updated in WP',
  `WP_Modified` datetime DEFAULT NULL COMMENT 'Date/Time property was last modified in WP',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time this record was last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMANU`
--

CREATE TABLE `mpMANU` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `OLP` decimal(11,2) DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) DEFAULT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) DEFAULT NULL,
  `STA` char(2) NOT NULL,
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `BR` decimal(4,2) NOT NULL,
  `BTH` decimal(4,2) NOT NULL,
  `ASF` int(10) UNSIGNED NOT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `DSRNUM` smallint(5) UNSIGNED DEFAULT NULL,
  `LDR` datetime DEFAULT NULL,
  `LD` datetime NOT NULL,
  `CLO` datetime DEFAULT NULL,
  `YBT` smallint(5) UNSIGNED NOT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) DEFAULT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `PDR` datetime DEFAULT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `DD` varchar(250) DEFAULT NULL,
  `AVDT` datetime DEFAULT NULL,
  `INDT` datetime DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `CTDT` datetime DEFAULT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `VIRT` varchar(200) DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `SDT` datetime NOT NULL,
  `FIN` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `QBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `AGR` char(1) DEFAULT NULL,
  `BDC` char(1) DEFAULT NULL,
  `BUS` char(1) DEFAULT NULL,
  `EL` varchar(20) DEFAULT NULL,
  `F17` char(1) DEFAULT NULL,
  `FAC` char(1) DEFAULT NULL,
  `FBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `FP` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `JH` varchar(20) DEFAULT NULL,
  `LNI` char(1) DEFAULT NULL,
  `LSD` varchar(40) DEFAULT NULL,
  `LSZ` varchar(40) DEFAULT NULL,
  `MFY` char(1) DEFAULT NULL,
  `MGR` varchar(50) DEFAULT NULL,
  `MHM` varchar(40) DEFAULT NULL,
  `MHN` varchar(40) DEFAULT NULL,
  `MHS` varchar(40) DEFAULT NULL,
  `NAS` tinyint(2) UNSIGNED DEFAULT NULL,
  `NOH` smallint(4) UNSIGNED DEFAULT NULL,
  `PAS` char(1) DEFAULT NULL,
  `POC` varchar(40) DEFAULT NULL,
  `PRK` varchar(40) DEFAULT NULL,
  `TQBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `SFS` varchar(40) DEFAULT NULL,
  `SH` varchar(20) DEFAULT NULL,
  `SKR` varchar(24) DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `SNR` char(1) DEFAULT NULL,
  `SPR` smallint(4) DEFAULT NULL,
  `STG` varchar(50) DEFAULT NULL,
  `STL` varchar(50) DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `SWC` varchar(40) DEFAULT NULL,
  `TX` int(10) UNSIGNED DEFAULT NULL,
  `TXY` smallint(5) UNSIGNED DEFAULT NULL,
  `UCS` char(1) DEFAULT NULL,
  `WAC` varchar(40) DEFAULT NULL,
  `WHT` varchar(40) DEFAULT NULL,
  `ANC` varchar(20) DEFAULT NULL,
  `APS` varchar(20) DEFAULT NULL,
  `CTD` varchar(12) DEFAULT NULL,
  `ENS` varchar(24) DEFAULT NULL,
  `EXT` varchar(30) DEFAULT NULL,
  `FLS` varchar(26) DEFAULT NULL,
  `HTC` varchar(40) DEFAULT NULL,
  `LDE` varchar(26) DEFAULT NULL,
  `MHF` varchar(40) DEFAULT NULL,
  `OTR` varchar(40) DEFAULT NULL,
  `PKA` varchar(40) DEFAULT NULL,
  `PKG` varchar(20) DEFAULT NULL,
  `POS` varchar(8) DEFAULT NULL,
  `RF` varchar(18) DEFAULT NULL,
  `SRI` char(12) DEFAULT NULL,
  `TRM` varchar(28) DEFAULT NULL,
  `VEW` varchar(28) DEFAULT NULL,
  `WAS` varchar(40) DEFAULT NULL,
  `WFT` varchar(36) DEFAULT NULL,
  `ProhibitBLOG` char(1) DEFAULT NULL,
  `AllowAVM` char(1) DEFAULT NULL,
  `PARQ` char(1) DEFAULT NULL,
  `BREO` char(1) DEFAULT NULL,
  `Auction` char(1) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `OFF` varchar(32) DEFAULT NULL,
  `OFFRD` date DEFAULT NULL,
  `SaleType` char(3) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMANUimages`
--

CREATE TABLE `mpMANUimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMANUupdates`
--

CREATE TABLE `mpMANUupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMANUwp`
--

CREATE TABLE `mpMANUwp` (
  `UniqueID` varchar(48) NOT NULL COMMENT 'Usually MLS_Vendor-MLS-LN',
  `MLS_Vendor` varchar(16) NOT NULL COMMENT 'MLS Vendor ID (e.g. NWMLS)',
  `LN` int(10) UNSIGNED NOT NULL COMMENT 'MLS Listing Number',
  `Status` char(1) NOT NULL COMMENT 'MLS Status of property (A,P,S)',
  `PropertyDate` datetime NOT NULL COMMENT 'Update Date for property when last updated from MLS',
  `CMA_CashFlow` float NOT NULL DEFAULT '0' COMMENT 'CMA Cash Flow',
  `CMA_CapRate` float NOT NULL DEFAULT '0' COMMENT 'CMA Cap Rate',
  `CMA_RentToValue` float NOT NULL DEFAULT '0' COMMENT 'CMA Rent-to-Value Ratio',
  `CMA_SuccessCriteria` varchar(22) DEFAULT NULL COMMENT 'CMA Success Criteria',
  `CMA_CriteriaThreshold` float NOT NULL DEFAULT '0' COMMENT 'CMA Criteria Threshold',
  `CMA_CriteriaResult` char(7) DEFAULT NULL COMMENT 'CMA Criteria Result',
  `CMA_MarketValue` float NOT NULL DEFAULT '0' COMMENT 'CMA Estimated Market Value',
  `CMA_Results` varchar(4000) DEFAULT NULL COMMENT 'CMA Results JSON',
  `CMA_Modified` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Date/Time CMA was last modified',
  `WP_PostID` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'WordPress Post ID for property',
  `WP_Status` char(1) DEFAULT NULL COMMENT 'Status of property (A,P,S) when last updated in WP',
  `WP_PropertyDate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Update Date for property when last updated in WP',
  `WP_Modified` datetime DEFAULT NULL COMMENT 'Date/Time property was last modified in WP',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time this record was last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMULT`
--

CREATE TABLE `mpMULT` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `OLP` decimal(11,2) DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) DEFAULT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) DEFAULT NULL,
  `STA` char(2) NOT NULL,
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `BR` decimal(4,2) NOT NULL,
  `BTH` decimal(4,2) NOT NULL,
  `ASF` int(10) UNSIGNED NOT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `DSRNUM` smallint(5) UNSIGNED DEFAULT NULL,
  `LDR` datetime DEFAULT NULL,
  `LD` datetime NOT NULL,
  `CLO` datetime DEFAULT NULL,
  `YBT` smallint(5) UNSIGNED NOT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) DEFAULT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `PDR` datetime DEFAULT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `DD` varchar(250) DEFAULT NULL,
  `AVDT` datetime DEFAULT NULL,
  `INDT` datetime DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `CTDT` datetime DEFAULT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `VIRT` varchar(200) DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `SDT` datetime NOT NULL,
  `FIN` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `FBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `TQBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `QBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `SFS` varchar(40) DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `BDC` char(1) DEFAULT NULL,
  `BLK` varchar(40) DEFAULT NULL,
  `CAP` decimal(5,2) DEFAULT NULL,
  `EL` varchar(20) DEFAULT NULL,
  `ELEX` smallint(4) UNSIGNED DEFAULT NULL,
  `EXP` int(6) UNSIGNED DEFAULT NULL,
  `F17` char(1) DEFAULT NULL,
  `FND` varchar(20) DEFAULT NULL,
  `GAI` int(4) UNSIGNED DEFAULT NULL,
  `GRM` smallint(2) UNSIGNED DEFAULT NULL,
  `GSI` int(6) UNSIGNED DEFAULT NULL,
  `GSP` smallint(4) UNSIGNED DEFAULT NULL,
  `HET` smallint(4) UNSIGNED DEFAULT NULL,
  `HOD` smallint(5) UNSIGNED DEFAULT NULL,
  `INS` smallint(4) UNSIGNED DEFAULT NULL,
  `JH` varchar(20) DEFAULT NULL,
  `LSZ` varchar(40) DEFAULT NULL,
  `LT` varchar(40) DEFAULT NULL,
  `NC` char(1) DEFAULT NULL,
  `NCS` smallint(4) UNSIGNED DEFAULT NULL,
  `NOI` int(6) UNSIGNED DEFAULT NULL,
  `NOU` smallint(4) UNSIGNED DEFAULT NULL,
  `OTX` int(4) UNSIGNED DEFAULT NULL,
  `POC` varchar(40) DEFAULT NULL,
  `POL` char(1) DEFAULT NULL,
  `PRJ` varchar(50) DEFAULT NULL,
  `PTO` char(1) DEFAULT NULL,
  `SAP` tinyint(3) UNSIGNED DEFAULT NULL,
  `SH` varchar(20) DEFAULT NULL,
  `SIB` tinyint(2) UNSIGNED DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `SWC` varchar(40) DEFAULT NULL,
  `TEX` int(6) UNSIGNED DEFAULT NULL,
  `TIN` int(6) UNSIGNED DEFAULT NULL,
  `TSP` smallint(4) UNSIGNED DEFAULT NULL,
  `TX` int(10) UNSIGNED DEFAULT NULL,
  `TXY` smallint(5) UNSIGNED DEFAULT NULL,
  `UBG` char(1) DEFAULT NULL,
  `USP` smallint(4) UNSIGNED DEFAULT NULL,
  `VAC` smallint(4) UNSIGNED DEFAULT NULL,
  `WAC` varchar(40) DEFAULT NULL,
  `WSG` int(4) UNSIGNED DEFAULT NULL,
  `ZJD` varchar(6) DEFAULT NULL,
  `AMN` varchar(22) DEFAULT NULL,
  `ENS` varchar(24) DEFAULT NULL,
  `EXT` varchar(30) DEFAULT NULL,
  `FLS` varchar(26) DEFAULT NULL,
  `GZC` varchar(26) DEFAULT NULL,
  `HTC` varchar(40) DEFAULT NULL,
  `LDE` varchar(26) DEFAULT NULL,
  `LIT` varchar(32) DEFAULT NULL,
  `POS` varchar(8) DEFAULT NULL,
  `RF` varchar(18) DEFAULT NULL,
  `SIT` varchar(52) DEFAULT NULL,
  `SWR` varchar(14) DEFAULT NULL,
  `TRM` varchar(28) DEFAULT NULL,
  `VEW` varchar(28) DEFAULT NULL,
  `WAS` varchar(40) DEFAULT NULL,
  `WFT` varchar(36) DEFAULT NULL,
  `UN1` varchar(40) DEFAULT NULL,
  `BR1` decimal(4,2) DEFAULT NULL,
  `BA1` decimal(4,2) DEFAULT NULL,
  `SF1` int(4) UNSIGNED DEFAULT NULL,
  `RN1` int(4) UNSIGNED DEFAULT NULL,
  `FP1` tinyint(1) UNSIGNED DEFAULT NULL,
  `WD1` char(1) DEFAULT NULL,
  `RO1` char(1) DEFAULT NULL,
  `FG1` char(1) DEFAULT NULL,
  `DW1` char(1) DEFAULT NULL,
  `UN2` varchar(40) DEFAULT NULL,
  `BR2` decimal(4,2) DEFAULT NULL,
  `BA2` decimal(4,2) DEFAULT NULL,
  `SF2` int(4) UNSIGNED DEFAULT NULL,
  `RN2` int(4) UNSIGNED DEFAULT NULL,
  `FP2` tinyint(1) UNSIGNED DEFAULT NULL,
  `WD2` char(1) DEFAULT NULL,
  `RO2` char(1) DEFAULT NULL,
  `FG2` char(1) DEFAULT NULL,
  `DW2` char(1) DEFAULT NULL,
  `UN3` varchar(40) DEFAULT NULL,
  `BR3` decimal(4,2) DEFAULT NULL,
  `BA3` decimal(4,2) DEFAULT NULL,
  `SF3` int(4) UNSIGNED DEFAULT NULL,
  `RN3` int(4) UNSIGNED DEFAULT NULL,
  `FP3` tinyint(1) UNSIGNED DEFAULT NULL,
  `WD3` char(1) DEFAULT NULL,
  `RO3` char(1) DEFAULT NULL,
  `FG3` char(1) DEFAULT NULL,
  `DW3` char(1) DEFAULT NULL,
  `UN4` varchar(40) DEFAULT NULL,
  `BR4` decimal(4,2) DEFAULT NULL,
  `BA4` decimal(4,2) DEFAULT NULL,
  `SF4` int(4) UNSIGNED DEFAULT NULL,
  `RN4` int(4) UNSIGNED DEFAULT NULL,
  `FP4` tinyint(1) UNSIGNED DEFAULT NULL,
  `WD4` char(1) DEFAULT NULL,
  `RO4` char(1) DEFAULT NULL,
  `FG4` char(1) DEFAULT NULL,
  `DW4` char(1) DEFAULT NULL,
  `UN5` varchar(40) DEFAULT NULL,
  `BR5` decimal(4,2) DEFAULT NULL,
  `BA5` decimal(4,2) DEFAULT NULL,
  `SF5` int(4) UNSIGNED DEFAULT NULL,
  `RN5` int(4) UNSIGNED DEFAULT NULL,
  `FP5` tinyint(1) UNSIGNED DEFAULT NULL,
  `WD5` char(1) DEFAULT NULL,
  `RO5` char(1) DEFAULT NULL,
  `FG5` char(1) DEFAULT NULL,
  `DW5` char(1) DEFAULT NULL,
  `UN6` varchar(40) DEFAULT NULL,
  `BR6` decimal(4,2) DEFAULT NULL,
  `BA6` decimal(4,2) DEFAULT NULL,
  `SF6` int(4) UNSIGNED DEFAULT NULL,
  `RN6` int(4) UNSIGNED DEFAULT NULL,
  `FP6` tinyint(1) UNSIGNED DEFAULT NULL,
  `WD6` char(1) DEFAULT NULL,
  `RO6` char(1) DEFAULT NULL,
  `FG6` char(1) DEFAULT NULL,
  `DW6` char(1) DEFAULT NULL,
  `ProhibitBLOG` char(1) DEFAULT NULL,
  `AllowAVM` char(1) DEFAULT NULL,
  `PARQ` char(1) DEFAULT NULL,
  `BREO` char(1) DEFAULT NULL,
  `BuiltGreenRating` varchar(32) DEFAULT NULL,
  `EPSEnergy` tinyint(3) UNSIGNED DEFAULT NULL,
  `ROFR` char(1) DEFAULT NULL,
  `HERSIndex` tinyint(3) UNSIGNED DEFAULT NULL,
  `LEEDRating` varchar(32) DEFAULT NULL,
  `NewConstruction` char(1) DEFAULT NULL,
  `NWESHRating` varchar(32) DEFAULT NULL,
  `ConstructionMethods` varchar(16) DEFAULT NULL,
  `Auction` char(1) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `EffectiveYearBuilt` smallint(5) UNSIGNED DEFAULT NULL,
  `EffectiveYearBuiltSource` char(2) DEFAULT NULL,
  `OFF` varchar(32) DEFAULT NULL,
  `OFFRD` date DEFAULT NULL,
  `SaleType` char(3) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMULTimages`
--

CREATE TABLE `mpMULTimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMULTupdates`
--

CREATE TABLE `mpMULTupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpMULTwp`
--

CREATE TABLE `mpMULTwp` (
  `UniqueID` varchar(48) NOT NULL COMMENT 'Usually MLS_Vendor-MLS-LN',
  `MLS_Vendor` varchar(16) NOT NULL COMMENT 'MLS Vendor ID (e.g. NWMLS)',
  `LN` int(10) UNSIGNED NOT NULL COMMENT 'MLS Listing Number',
  `Status` char(1) NOT NULL COMMENT 'MLS Status of property (A,P,S)',
  `PropertyDate` datetime NOT NULL COMMENT 'Update Date for property when last updated from MLS',
  `WP_PostID` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'WordPress Post ID for property',
  `WP_Status` char(1) DEFAULT NULL COMMENT 'Status of property (A,P,S) when last updated in WP',
  `WP_PropertyDate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Update Date for property when last updated in WP',
  `WP_Modified` datetime DEFAULT NULL COMMENT 'Date/Time property was last modified in WP',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time this record was last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRENT`
--

CREATE TABLE `mpRENT` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) NOT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) NOT NULL,
  `STA` char(2) NOT NULL DEFAULT 'WA',
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `BR` decimal(4,2) NOT NULL,
  `BTH` decimal(4,2) NOT NULL,
  `ASF` int(10) UNSIGNED NOT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `LDR` datetime DEFAULT NULL,
  `CLO` datetime DEFAULT NULL,
  `YBT` smallint(5) UNSIGNED NOT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) NOT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `EL` varchar(20) DEFAULT NULL,
  `FP` tinyint(3) UNSIGNED DEFAULT NULL,
  `FUR` char(1) DEFAULT 'N',
  `JH` varchar(20) DEFAULT NULL,
  `LT` varchar(40) DEFAULT NULL,
  `MLT` tinyint(2) UNSIGNED NOT NULL DEFAULT '0',
  `POL` char(1) DEFAULT NULL,
  `PRJ` varchar(50) DEFAULT NULL,
  `SH` varchar(20) DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `STO` char(1) DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `AFR` varchar(32) DEFAULT NULL,
  `APP` varchar(32) DEFAULT NULL,
  `BSM` varchar(12) DEFAULT NULL,
  `CTD` char(8) DEFAULT NULL,
  `ENS` varchar(24) DEFAULT NULL,
  `GR` varchar(20) DEFAULT NULL,
  `HTC` varchar(40) DEFAULT NULL,
  `MIF` varchar(16) DEFAULT NULL,
  `SIT` varchar(52) DEFAULT NULL,
  `SWR` varchar(14) DEFAULT NULL,
  `TMC` varchar(12) DEFAULT NULL,
  `TYP` char(8) DEFAULT NULL,
  `UTL` varchar(24) DEFAULT NULL,
  `VEW` varchar(28) DEFAULT NULL,
  `WFT` varchar(36) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `EffectiveYearBuilt` smallint(5) UNSIGNED DEFAULT NULL,
  `EffectiveYearBuiltSource` char(2) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRENTimages`
--

CREATE TABLE `mpRENTimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRENTupdates`
--

CREATE TABLE `mpRENTupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HHH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRESI`
--

CREATE TABLE `mpRESI` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `OLP` decimal(11,2) DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) DEFAULT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) DEFAULT NULL,
  `STA` char(2) NOT NULL,
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `BR` decimal(4,2) NOT NULL,
  `BTH` decimal(4,2) NOT NULL,
  `ASF` int(10) UNSIGNED NOT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `DSRNUM` smallint(5) UNSIGNED DEFAULT NULL,
  `LDR` datetime DEFAULT NULL,
  `LD` datetime NOT NULL,
  `CLO` datetime DEFAULT NULL,
  `YBT` smallint(5) UNSIGNED NOT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) DEFAULT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `PDR` datetime DEFAULT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `DD` varchar(250) DEFAULT NULL,
  `AVDT` datetime DEFAULT NULL,
  `INDT` datetime DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `CTDT` datetime DEFAULT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `VIRT` varchar(200) DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `SDT` datetime NOT NULL,
  `FIN` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `QBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `ADU` char(1) DEFAULT NULL,
  `ARC` char(1) DEFAULT NULL,
  `BDC` char(1) DEFAULT NULL,
  `BDL` tinyint(3) UNSIGNED DEFAULT NULL,
  `BDM` tinyint(3) UNSIGNED DEFAULT NULL,
  `BDU` tinyint(3) UNSIGNED DEFAULT NULL,
  `BLD` varchar(40) DEFAULT NULL,
  `BLK` varchar(40) DEFAULT NULL,
  `BRM` char(1) DEFAULT NULL,
  `BUS` char(1) DEFAULT NULL,
  `DNO` char(1) DEFAULT NULL,
  `DRM` char(1) DEFAULT NULL,
  `EFR` char(1) DEFAULT NULL,
  `EL` varchar(20) DEFAULT NULL,
  `ENT` char(1) DEFAULT NULL,
  `F17` char(1) DEFAULT NULL,
  `FAM` char(1) DEFAULT NULL,
  `FBG` tinyint(3) UNSIGNED DEFAULT NULL,
  `FBL` tinyint(3) UNSIGNED DEFAULT NULL,
  `FBM` tinyint(3) UNSIGNED DEFAULT NULL,
  `FBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `FBU` tinyint(3) UNSIGNED DEFAULT NULL,
  `FP` tinyint(3) UNSIGNED DEFAULT NULL,
  `FPL` tinyint(3) UNSIGNED DEFAULT NULL,
  `FPM` tinyint(3) UNSIGNED DEFAULT NULL,
  `FPU` tinyint(3) UNSIGNED DEFAULT NULL,
  `GAR` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBG` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBL` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBM` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBU` tinyint(3) UNSIGNED DEFAULT NULL,
  `HOD` smallint(5) UNSIGNED DEFAULT NULL,
  `JH` varchar(20) DEFAULT NULL,
  `KES` char(1) DEFAULT NULL,
  `KIT` char(1) DEFAULT NULL,
  `LRM` char(1) DEFAULT NULL,
  `LSD` varchar(40) DEFAULT NULL,
  `LSZ` varchar(40) DEFAULT NULL,
  `LT` varchar(40) DEFAULT NULL,
  `MBD` char(1) DEFAULT NULL,
  `MHM` varchar(40) DEFAULT NULL,
  `MHN` varchar(40) DEFAULT NULL,
  `MHS` varchar(40) DEFAULT NULL,
  `MOR` int(10) UNSIGNED DEFAULT NULL,
  `NC` char(1) DEFAULT NULL,
  `POC` varchar(40) DEFAULT NULL,
  `POL` char(1) DEFAULT NULL,
  `PRJ` varchar(50) DEFAULT NULL,
  `PTO` char(1) DEFAULT NULL,
  `TQBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `RRM` char(1) DEFAULT NULL,
  `CMFE` varchar(100) DEFAULT NULL,
  `SAP` tinyint(3) UNSIGNED DEFAULT NULL,
  `SFF` int(10) UNSIGNED DEFAULT NULL,
  `SFS` varchar(40) DEFAULT NULL,
  `SFU` int(10) UNSIGNED DEFAULT NULL,
  `SH` varchar(20) DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `SNR` char(1) DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `SWC` varchar(40) DEFAULT NULL,
  `TBG` tinyint(3) UNSIGNED DEFAULT NULL,
  `TBL` tinyint(3) UNSIGNED DEFAULT NULL,
  `TBM` tinyint(3) UNSIGNED DEFAULT NULL,
  `TBU` tinyint(3) UNSIGNED DEFAULT NULL,
  `TX` int(10) UNSIGNED DEFAULT NULL,
  `TXY` smallint(5) UNSIGNED DEFAULT NULL,
  `UTR` char(1) DEFAULT NULL,
  `WAC` varchar(40) DEFAULT NULL,
  `WFG` varchar(40) DEFAULT NULL,
  `WHT` varchar(40) DEFAULT NULL,
  `APS` varchar(20) DEFAULT NULL,
  `BDI` varchar(12) DEFAULT NULL,
  `BSM` varchar(12) DEFAULT NULL,
  `ENS` varchar(24) DEFAULT NULL,
  `EXT` varchar(30) DEFAULT NULL,
  `FEA` varchar(60) DEFAULT NULL,
  `FLS` varchar(26) DEFAULT NULL,
  `FND` varchar(20) DEFAULT NULL,
  `GR` varchar(20) DEFAULT NULL,
  `HTC` varchar(40) DEFAULT NULL,
  `LDE` varchar(26) DEFAULT NULL,
  `LTV` varchar(36) DEFAULT NULL,
  `POS` varchar(8) DEFAULT NULL,
  `RF` varchar(18) DEFAULT NULL,
  `SIT` varchar(52) DEFAULT NULL,
  `SWR` varchar(14) DEFAULT NULL,
  `TRM` varchar(28) DEFAULT NULL,
  `VEW` varchar(28) DEFAULT NULL,
  `WAS` varchar(40) DEFAULT NULL,
  `WFT` varchar(36) DEFAULT NULL,
  `BUSR` varchar(20) DEFAULT NULL,
  `ECRT` varchar(10) DEFAULT NULL,
  `ZJD` varchar(6) DEFAULT NULL,
  `ZNC` varchar(20) DEFAULT NULL,
  `ProhibitBLOG` char(1) DEFAULT NULL,
  `AllowAVM` char(1) DEFAULT NULL,
  `PARQ` char(1) DEFAULT NULL,
  `BREO` char(1) DEFAULT NULL,
  `BuiltGreenRating` varchar(32) DEFAULT NULL,
  `EPSEnergy` tinyint(3) UNSIGNED DEFAULT NULL,
  `ROFR` char(1) DEFAULT NULL,
  `HERSIndex` tinyint(3) UNSIGNED DEFAULT NULL,
  `LEEDRating` varchar(32) DEFAULT NULL,
  `NewConstruction` char(1) DEFAULT NULL,
  `NWESHRating` varchar(32) DEFAULT NULL,
  `ConstructionMethods` varchar(16) DEFAULT NULL,
  `Auction` char(1) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `EffectiveYearBuilt` smallint(5) UNSIGNED DEFAULT NULL,
  `EffectiveYearBuiltSource` char(2) DEFAULT NULL,
  `OFF` varchar(32) DEFAULT NULL,
  `OFFRD` date DEFAULT NULL,
  `SaleType` char(3) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRESIimages`
--

CREATE TABLE `mpRESIimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRESIupdates`
--

CREATE TABLE `mpRESIupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HHH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpRESIwp`
--

CREATE TABLE `mpRESIwp` (
  `UniqueID` varchar(48) NOT NULL COMMENT 'Usually MLS_Vendor-MLS-LN',
  `MLS_Vendor` varchar(16) NOT NULL COMMENT 'MLS Vendor ID (e.g. NWMLS)',
  `LN` int(10) UNSIGNED NOT NULL COMMENT 'MLS Listing Number',
  `Status` char(1) NOT NULL COMMENT 'MLS Status of property (A,P,S)',
  `PropertyDate` datetime NOT NULL COMMENT 'Update Date for property when last updated from MLS',
  `CMA_CashFlow` float NOT NULL DEFAULT '0' COMMENT 'CMA Cash Flow',
  `CMA_CapRate` float NOT NULL DEFAULT '0' COMMENT 'CMA Cap Rate',
  `CMA_RentToValue` float NOT NULL DEFAULT '0' COMMENT 'CMA Rent-to-Value Ratio',
  `CMA_SuccessCriteria` varchar(22) DEFAULT NULL COMMENT 'CMA Success Criteria',
  `CMA_CriteriaThreshold` float NOT NULL DEFAULT '0' COMMENT 'CMA Criteria Threshold',
  `CMA_CriteriaResult` char(7) DEFAULT NULL COMMENT 'CMA Criteria Result',
  `CMA_MarketValue` float NOT NULL DEFAULT '0' COMMENT 'CMA Estimated Market Value',
  `CMA_Results` varchar(4000) DEFAULT NULL COMMENT 'CMA Results JSON',
  `CMA_Modified` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Date/Time CMA was last modified',
  `WP_PostID` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'WordPress Post ID for property',
  `WP_Status` char(1) DEFAULT NULL COMMENT 'Status of property (A,P,S) when last updated in WP',
  `WP_PropertyDate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Update Date for property when last updated in WP',
  `WP_Modified` datetime DEFAULT NULL COMMENT 'Date/Time property was last modified in WP',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time this record was last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpStatsByCity`
--

CREATE TABLE `mpStatsByCity` (
  `Seq` bigint(8) NOT NULL COMMENT 'Sequence (Auto Increment)',
  `CityYearMonthPtype` varchar(36) NOT NULL COMMENT 'City_Year_Month_Ptype - Unique key for searching',
  `City` varchar(24) NOT NULL COMMENT 'City',
  `Year` int(4) NOT NULL COMMENT 'Year',
  `Month` tinyint(2) NOT NULL COMMENT 'Month',
  `MonthDate` date NOT NULL COMMENT 'Month as Date using 1st day  (e.g. 2017-11-01)',
  `PropertyType` char(4) NOT NULL COMMENT 'Property Type',
  `TotalActive` int(4) NOT NULL COMMENT 'Total Active Listings',
  `TotalPending` int(4) NOT NULL COMMENT 'Total Pending Listings',
  `TotalSold` int(4) NOT NULL COMMENT 'Total Sold Listings',
  `AvgDaysToSell` float NOT NULL COMMENT 'Average Days to Sell',
  `AvgSalePrice` float NOT NULL COMMENT 'Average Sale Price',
  `AvgPricePerSqft` float NOT NULL COMMENT 'Average Price Per Sqft',
  `AvgSPtoLPratio` float NOT NULL COMMENT 'Average Sale Price to Listing Price Ratio',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time record last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Per month stats for each property type';

-- --------------------------------------------------------

--
-- Table structure for table `mpStatsByCounty`
--

CREATE TABLE `mpStatsByCounty` (
  `Seq` bigint(8) NOT NULL COMMENT 'Sequence (Auto Increment)',
  `CountyYearMonthPtype` varchar(36) NOT NULL COMMENT 'County_Year_Month_Ptype - Unique key for searching',
  `County` varchar(24) NOT NULL COMMENT 'County',
  `Year` int(4) NOT NULL COMMENT 'Year',
  `Month` tinyint(2) NOT NULL COMMENT 'Month',
  `MonthDate` date NOT NULL COMMENT 'Month as Date using 1st day  (e.g. 2017-11-01)',
  `PropertyType` char(4) NOT NULL COMMENT 'Property Type',
  `TotalActive` int(4) NOT NULL COMMENT 'Total Active Listings',
  `TotalPending` int(4) NOT NULL COMMENT 'Total Pending Listings',
  `TotalSold` int(4) NOT NULL COMMENT 'Total Sold Listings',
  `AvgDaysToSell` float NOT NULL COMMENT 'Average Days to Sell',
  `AvgSalePrice` float NOT NULL COMMENT 'Average Sale Price',
  `AvgPricePerSqft` float NOT NULL COMMENT 'Average Price Per Sqft',
  `AvgSPtoLPratio` float NOT NULL COMMENT 'Average Sale Price to Listing Price Ratio',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time record last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Per month stats for each property type';

-- --------------------------------------------------------

--
-- Table structure for table `mpStatsByZip`
--

CREATE TABLE `mpStatsByZip` (
  `Seq` bigint(8) NOT NULL COMMENT 'Sequence (Auto Increment)',
  `ZipYearMonthPtype` char(18) NOT NULL COMMENT 'Zip_Year_Month_Ptype - Unique key for searching',
  `Zip` char(5) NOT NULL COMMENT 'Zipcode',
  `Year` int(4) NOT NULL COMMENT 'Year',
  `Month` tinyint(2) NOT NULL COMMENT 'Month',
  `MonthDate` date NOT NULL COMMENT 'Month as Date using 1st day  (e.g. 2017-11-01)',
  `PropertyType` char(4) NOT NULL COMMENT 'Property Type',
  `TotalActive` int(4) NOT NULL COMMENT 'Total Active Listings',
  `TotalPending` int(4) NOT NULL COMMENT 'Total Pending Listings',
  `TotalSold` int(4) NOT NULL COMMENT 'Total Sold Listings',
  `AvgDaysToSell` float NOT NULL COMMENT 'Average Days to Sell',
  `AvgSalePrice` float NOT NULL COMMENT 'Average Sale Price',
  `AvgPricePerSqft` float NOT NULL COMMENT 'Average Price Per Sqft',
  `AvgSPtoLPratio` float NOT NULL COMMENT 'Average Sale Price to Listing Price Ratio',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time record last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Per month stats for each property type';

-- --------------------------------------------------------

--
-- Table structure for table `mpStatsUpdates`
--

CREATE TABLE `mpStatsUpdates` (
  `Seq` int(11) NOT NULL COMMENT 'Sequence (Auto Increment)',
  `PeriodBeginDate` date NOT NULL COMMENT 'Period Begin Date',
  `PeriodEndDate` date NOT NULL COMMENT 'Period End Date',
  `StartedTime` datetime NOT NULL COMMENT 'Time update started',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Time update completed',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last modified time of this record'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpVACL`
--

CREATE TABLE `mpVACL` (
  `LN` int(8) UNSIGNED NOT NULL,
  `PTYP` char(4) NOT NULL,
  `LAG` int(6) UNSIGNED DEFAULT NULL,
  `ST` char(5) NOT NULL,
  `LP` decimal(11,2) UNSIGNED NOT NULL,
  `SP` decimal(11,2) UNSIGNED DEFAULT NULL,
  `OLP` decimal(11,2) DEFAULT NULL,
  `HSN` int(10) UNSIGNED NOT NULL,
  `DRP` char(4) DEFAULT NULL,
  `STR` varchar(30) DEFAULT NULL,
  `SSUF` char(6) DEFAULT NULL,
  `DRS` char(4) DEFAULT NULL,
  `UNT` char(5) DEFAULT NULL,
  `CIT` varchar(21) DEFAULT NULL,
  `STA` char(2) NOT NULL,
  `ZIP` char(5) DEFAULT NULL,
  `PL4` char(4) DEFAULT NULL,
  `LSF` int(10) UNSIGNED DEFAULT NULL,
  `UD` datetime NOT NULL,
  `AR` smallint(5) UNSIGNED NOT NULL,
  `DSRNUM` smallint(5) UNSIGNED DEFAULT NULL,
  `LDR` datetime DEFAULT NULL,
  `LD` datetime NOT NULL,
  `CLO` datetime DEFAULT NULL,
  `LO` smallint(5) UNSIGNED NOT NULL,
  `TAX` varchar(40) DEFAULT NULL,
  `MAP` varchar(10) DEFAULT NULL,
  `GRDX` char(4) DEFAULT NULL,
  `GRDY` char(4) DEFAULT NULL,
  `SAG` int(6) UNSIGNED DEFAULT NULL,
  `SO` smallint(5) UNSIGNED DEFAULT NULL,
  `NIA` char(1) DEFAULT NULL,
  `MR` varchar(1000) DEFAULT NULL,
  `LONG` decimal(9,6) NOT NULL,
  `LAT` decimal(8,6) NOT NULL,
  `PDR` datetime DEFAULT NULL,
  `CLA` int(6) UNSIGNED DEFAULT NULL,
  `SHOADR` char(1) DEFAULT NULL,
  `DD` varchar(250) DEFAULT NULL,
  `AVDT` datetime DEFAULT NULL,
  `INDT` datetime DEFAULT NULL,
  `COU` varchar(21) NOT NULL,
  `CDOM` tinyint(3) UNSIGNED NOT NULL,
  `CTDT` datetime DEFAULT NULL,
  `SCA` int(6) UNSIGNED DEFAULT NULL,
  `SCO` smallint(5) UNSIGNED DEFAULT NULL,
  `VIRT` varchar(200) DEFAULT NULL,
  `SD` char(4) DEFAULT NULL,
  `SDT` datetime NOT NULL,
  `FIN` char(4) DEFAULT NULL,
  `MAPBOOK` char(4) DEFAULT NULL,
  `DSR` varchar(40) DEFAULT NULL,
  `FBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `TQBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `HBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `QBT` tinyint(3) UNSIGNED DEFAULT NULL,
  `SFS` varchar(40) DEFAULT NULL,
  `HSNA` char(8) DEFAULT NULL,
  `COLO` smallint(5) UNSIGNED DEFAULT NULL,
  `PIC` tinyint(3) UNSIGNED DEFAULT NULL,
  `BLK` varchar(40) DEFAULT NULL,
  `EL` varchar(20) DEFAULT NULL,
  `ELE` varchar(10) DEFAULT NULL,
  `ESM` varchar(40) DEFAULT NULL,
  `F17` char(1) DEFAULT NULL,
  `GAS` varchar(10) DEFAULT NULL,
  `JH` varchar(20) DEFAULT NULL,
  `LSZ` varchar(40) DEFAULT NULL,
  `LT` varchar(40) DEFAULT NULL,
  `LVL` varchar(40) DEFAULT NULL,
  `PRJ` varchar(50) DEFAULT NULL,
  `PTO` char(1) DEFAULT NULL,
  `QTR` int(4) UNSIGNED NOT NULL,
  `RD` varchar(40) DEFAULT NULL,
  `SAP` tinyint(3) UNSIGNED DEFAULT NULL,
  `SDA` char(1) DEFAULT NULL,
  `SEC` int(6) UNSIGNED DEFAULT NULL,
  `SEP` char(1) DEFAULT NULL,
  `SFA` char(1) DEFAULT NULL,
  `SH` varchar(20) DEFAULT NULL,
  `SLP` varchar(40) DEFAULT NULL,
  `SML` char(1) DEFAULT NULL,
  `SNR` char(1) DEFAULT NULL,
  `SST` varchar(40) DEFAULT NULL,
  `STY` char(2) DEFAULT NULL,
  `SUR` varchar(40) DEFAULT NULL,
  `SWR` varchar(14) DEFAULT NULL,
  `TER` varchar(40) DEFAULT NULL,
  `TX` int(10) UNSIGNED DEFAULT NULL,
  `TXY` smallint(5) UNSIGNED DEFAULT NULL,
  `WFG` varchar(40) DEFAULT NULL,
  `WRJ` varchar(40) DEFAULT NULL,
  `ZJD` varchar(6) DEFAULT NULL,
  `ZNR` varchar(20) DEFAULT NULL,
  `ATF` varchar(18) DEFAULT NULL,
  `DOC` varchar(18) DEFAULT NULL,
  `FTR` varchar(40) DEFAULT NULL,
  `GZC` varchar(26) DEFAULT NULL,
  `IMP` varchar(60) DEFAULT NULL,
  `LDE` varchar(26) DEFAULT NULL,
  `POS` varchar(8) DEFAULT NULL,
  `RDI` varchar(24) DEFAULT NULL,
  `RS2` varchar(16) DEFAULT NULL,
  `TPO` varchar(48) DEFAULT NULL,
  `TRM` varchar(28) DEFAULT NULL,
  `VEW` varchar(28) DEFAULT NULL,
  `WFT` varchar(36) DEFAULT NULL,
  `WTR` varchar(48) DEFAULT NULL,
  `CMFE` varchar(100) DEFAULT NULL,
  `ProhibitBLOG` char(1) DEFAULT NULL,
  `AllowAVM` char(1) DEFAULT NULL,
  `PARQ` char(1) DEFAULT NULL,
  `BREO` char(1) DEFAULT NULL,
  `ROFR` char(1) DEFAULT NULL,
  `Auction` char(1) DEFAULT NULL,
  `LotSizeSource` varchar(30) DEFAULT NULL,
  `OFF` varchar(32) DEFAULT NULL,
  `OFFRD` date DEFAULT NULL,
  `SaleType` char(3) DEFAULT NULL,
  `mpStatus` char(1) NOT NULL,
  `mpStyle` tinyint(3) UNSIGNED NOT NULL,
  `mpGeoPos` geometry NOT NULL COMMENT 'Spatial Point (indexed) consisting of LONG and LAT values, for proximity search.',
  `mpTimeStamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time when last updated'
) ENGINE=Aria DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpVACLimages`
--

CREATE TABLE `mpVACLimages` (
  `ListingNumber` int(6) UNSIGNED NOT NULL,
  `ListingStatus` char(1) NOT NULL COMMENT 'A=Active,P=Pending,S=Sold',
  `ActiveCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files currently active and available.',
  `UpdateCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of images specified in last MLS update.',
  `LoadedCount` tinyint(2) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of image files actually loaded for current/last image update.',
  `PendingRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `LastRequest` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=None,L=Initial Image Load,U=Update Image Files',
  `ReqStatus` char(1) NOT NULL DEFAULT 'N' COMMENT 'N=Not Started,S=Started,C=Completed,F=Failed',
  `ReqStartedTime` datetime DEFAULT NULL,
  `ReqCompletedTime` datetime DEFAULT NULL,
  `ReqFailedTime` datetime DEFAULT NULL,
  `Availability` char(1) NOT NULL DEFAULT 'U' COMMENT 'A=Available, U=Unavailable',
  `LatestUploadDT` datetime DEFAULT NULL COMMENT 'Latest Upload DateTime of all listing image files.',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of latest update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpVACLupdates`
--

CREATE TABLE `mpVACLupdates` (
  `Seq` int(6) NOT NULL COMMENT 'Auto incrementing seq number',
  `Type` char(1) NOT NULL COMMENT 'M=Manual Load, U=Update, R=Resumed Update',
  `Status` char(1) NOT NULL COMMENT 'S=Started, C=Completed, F=Failed, R=Resumed, A=Aborted',
  `StartedTime` datetime NOT NULL COMMENT 'Start date/time of DB update',
  `IncompleteTime` datetime DEFAULT NULL COMMENT 'Incomplete status date/time (Resumed/Failed/Aborted)',
  `CompletedTime` datetime DEFAULT NULL COMMENT 'Completion date/time of DB update',
  `Duration` time DEFAULT NULL COMMENT 'Duration of update process in HHH:MM:SS (max is 838:59:59)',
  `MLS_Filename` varchar(100) DEFAULT NULL COMMENT 'Full path and name of data (soap) file',
  `MLS_BeginDate` datetime NOT NULL COMMENT 'MLS BeginDate Param',
  `MLS_EndDate` datetime NOT NULL COMMENT 'MLS EndDate Param',
  `MLS_LN` int(8) NOT NULL COMMENT 'Last listing number updated',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Auto timestamp of last update to this row'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `mpVACLwp`
--

CREATE TABLE `mpVACLwp` (
  `UniqueID` varchar(48) NOT NULL COMMENT 'Usually MLS_Vendor-MLS-LN',
  `MLS_Vendor` varchar(16) NOT NULL COMMENT 'MLS Vendor ID (e.g. NWMLS)',
  `LN` int(10) UNSIGNED NOT NULL COMMENT 'MLS Listing Number',
  `Status` char(1) NOT NULL COMMENT 'MLS Status of property (A,P,S)',
  `PropertyDate` datetime NOT NULL COMMENT 'Update Date for property when last updated from MLS',
  `WP_PostID` bigint(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'WordPress Post ID for property',
  `WP_Status` char(1) DEFAULT NULL COMMENT 'Status of property (A,P,S) when last updated in WP',
  `WP_PropertyDate` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT 'Update Date for property when last updated in WP',
  `WP_Modified` datetime DEFAULT NULL COMMENT 'Date/Time property was last modified in WP',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time this record was last modified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `NWMLS_Lookup_Field_Names`
--

CREATE TABLE `NWMLS_Lookup_Field_Names` (
  `Field_Name` varchar(32) NOT NULL COMMENT 'Name of the field',
  `Field_Description` varchar(48) DEFAULT NULL COMMENT 'Description for the field',
  `Field_Taxonomy` varchar(24) DEFAULT NULL COMMENT 'Name of field''s taxonomy'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `NWMLS_Lookup_Field_Values`
--

CREATE TABLE `NWMLS_Lookup_Field_Values` (
  `Field_Value` varchar(32) NOT NULL COMMENT 'Concat of Fieldname_Value',
  `Value_Description` varchar(64) NOT NULL,
  `Value_Taxonomy` varchar(64) DEFAULT NULL COMMENT 'Taxonomy hierarchy for value'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `NWMLS_Amenities`
--

CREATE TABLE `NWMLS_Amenities` (
  `NWMLS_FIELD_NAME` text NOT NULL COMMENT 'Name of the field',,
  `NWMLS_FIELD_DESCR` text DEFAULT NULL COMMENT 'Description for the field',,
  `NWMLS_VALUE_CODE` text NOT NULL COMMENT 'Value of the field',,
  `NWMLS_VALUE_DESCR` text NOT NULL COMMENT 'Description of the field value',
  `PROPERTY TYPE` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `NWMLS_Members`
--

CREATE TABLE `NWMLS_Members` (
  `MemberMLSID` int(10) UNSIGNED NOT NULL COMMENT 'Member ID',
  `FirstName` varchar(20) DEFAULT NULL COMMENT 'First Name',
  `LastName` varchar(40) NOT NULL COMMENT 'Last Name',
  `OfficeMLSID` int(10) UNSIGNED NOT NULL COMMENT 'Office ID',
  `OfficeName` varchar(40) NOT NULL COMMENT 'Office Name',
  `OfficeAreaCode` smallint(5) UNSIGNED NOT NULL COMMENT 'Office Ph Area Code',
  `OfficePhone` int(10) UNSIGNED NOT NULL COMMENT 'Office Ph Number',
  `OfficePhoneExtension` smallint(5) UNSIGNED NOT NULL COMMENT 'Office Ph Ext',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Modified Timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `NWMLS_Offices`
--

CREATE TABLE `NWMLS_Offices` (
  `OfficeMLSID` int(10) UNSIGNED NOT NULL COMMENT 'Office ID',
  `OfficeName` varchar(40) NOT NULL COMMENT 'Office Name',
  `StreetCareOf` varchar(20) DEFAULT NULL COMMENT 'Care Of',
  `StreetAddress` varchar(40) NOT NULL COMMENT 'Address',
  `StreetCity` varchar(20) NOT NULL COMMENT 'City',
  `StreetState` char(2) NOT NULL COMMENT 'State',
  `StreetZipCode` int(10) UNSIGNED NOT NULL COMMENT 'Zip',
  `StreetZipPlus4` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Zip+4',
  `StreetCounty` varchar(20) DEFAULT NULL COMMENT 'County',
  `OfficeAreaCode` smallint(5) UNSIGNED NOT NULL COMMENT 'Phone Area Code',
  `OfficePhone` int(10) UNSIGNED NOT NULL COMMENT 'Phone Number',
  `FaxAreaCode` smallint(5) UNSIGNED DEFAULT NULL COMMENT 'Fax Area Code',
  `FaxPhone` int(10) UNSIGNED DEFAULT NULL COMMENT 'Fax Number',
  `EMailAddress` varchar(60) DEFAULT NULL COMMENT 'Email Address',
  `WebPageAddress` varchar(60) DEFAULT NULL COMMENT 'Website URL',
  `OfficeType` char(5) NOT NULL COMMENT 'Office Type',
  `Timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last Modified Timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `rent-o-meter`
--

CREATE TABLE `rent-o-meter` (
  `address` int(11) NOT NULL COMMENT 'Zipcode',
  `status` char(10) NOT NULL COMMENT 'OK or NO_RESULTS',
  `report_time` date NOT NULL COMMENT 'Date data was generated',
  `bedrooms` tinyint(4) NOT NULL COMMENT 'Num of bedrooms',
  `mean` int(11) NOT NULL COMMENT 'Mean (Average) of values',
  `median` smallint(6) NOT NULL COMMENT 'Median value in sample',
  `min` smallint(6) NOT NULL COMMENT 'Min of all values',
  `max` smallint(6) NOT NULL COMMENT 'Max of all values',
  `std_dev` smallint(6) NOT NULL COMMENT 'Standard Deviation',
  `eightieth` smallint(6) NOT NULL COMMENT '80th Percentile',
  `twentieth` smallint(6) NOT NULL COMMENT '20th Percentile',
  `max_distance` float NOT NULL COMMENT 'Max Distance',
  `sample_size` smallint(6) NOT NULL COMMENT 'Sample Size'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `mpCOMI`
--
ALTER TABLE `mpCOMI`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `ASF` (`ASF`),
  ADD KEY `LSF` (`LSF`),
  ADD KEY `LD` (`LD`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `YBT` (`YBT`),
  ADD KEY `COU` (`COU`),
  ADD KEY `EffectiveYearBuilt` (`EffectiveYearBuilt`),
  ADD KEY `BDC` (`BDC`),
  ADD KEY `PARQ` (`PARQ`),
  ADD KEY `BREO` (`BREO`),
  ADD KEY `AVDT` (`AVDT`),
  ADD KEY `EXP` (`EXP`),
  ADD KEY `GAI` (`GAI`),
  ADD KEY `GSI` (`GSI`),
  ADD KEY `NNN` (`NNN`),
  ADD KEY `NOI` (`NOI`),
  ADD KEY `OSF` (`OSF`),
  ADD KEY `SIZ` (`SIZ`),
  ADD KEY `STF` (`STF`),
  ADD KEY `TAV` (`TAV`),
  ADD KEY `TEX` (`TEX`),
  ADD KEY `TRI` (`TRI`),
  ADD KEY `TSF` (`TSF`),
  ADD KEY `VAC` (`VAC`),
  ADD KEY `VAI` (`VAI`),
  ADD KEY `VAL` (`VAL`),
  ADD KEY `WSF` (`WSF`),
  ADD KEY `TRM` (`TRM`),
  ADD KEY `EffectiveYearBuiltSource` (`EffectiveYearBuiltSource`),
  ADD KEY `STY` (`STY`),
  ADD KEY `PDR` (`PDR`);

--
-- Indexes for table `mpCOMIimages`
--
ALTER TABLE `mpCOMIimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpCOMIupdates`
--
ALTER TABLE `mpCOMIupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpCOMIwp`
--
ALTER TABLE `mpCOMIwp`
  ADD PRIMARY KEY (`UniqueID`),
  ADD KEY `MLS_LN` (`LN`),
  ADD KEY `MLS_Date` (`PropertyDate`),
  ADD KEY `WP_PropertyDate` (`WP_PropertyDate`),
  ADD KEY `WP_Modified` (`WP_Modified`),
  ADD KEY `MLS_Vendor` (`MLS_Vendor`),
  ADD KEY `MLS_Status` (`Status`),
  ADD KEY `WP_Status` (`WP_Status`),
  ADD KEY `WP_PostID` (`WP_PostID`) USING BTREE;

--
-- Indexes for table `mpCOND`
--
ALTER TABLE `mpCOND`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `BR` (`BR`),
  ADD KEY `BTH` (`BTH`),
  ADD KEY `ASF` (`ASF`),
  ADD KEY `LD` (`LD`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `YBT` (`YBT`),
  ADD KEY `COU` (`COU`),
  ADD KEY `EffectiveYearBuilt` (`EffectiveYearBuilt`),
  ADD KEY `PARQ` (`PARQ`),
  ADD KEY `BREO` (`BREO`),
  ADD KEY `EffectiveYearBuiltSource` (`EffectiveYearBuiltSource`),
  ADD KEY `STY` (`STY`),
  ADD KEY `PDR` (`PDR`);

--
-- Indexes for table `mpCONDimages`
--
ALTER TABLE `mpCONDimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpCONDupdates`
--
ALTER TABLE `mpCONDupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpCONDwp`
--
ALTER TABLE `mpCONDwp`
  ADD PRIMARY KEY (`UniqueID`),
  ADD KEY `MLS_LN` (`LN`),
  ADD KEY `MLS_Date` (`PropertyDate`),
  ADD KEY `WP_PropertyDate` (`WP_PropertyDate`),
  ADD KEY `WP_Modified` (`WP_Modified`),
  ADD KEY `MLS_Vendor` (`MLS_Vendor`),
  ADD KEY `MLS_Status` (`Status`),
  ADD KEY `WP_Status` (`WP_Status`),
  ADD KEY `WP_PostID` (`WP_PostID`) USING BTREE;

--
-- Indexes for table `mpMANU`
--
ALTER TABLE `mpMANU`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `BR` (`BR`),
  ADD KEY `BTH` (`BTH`),
  ADD KEY `ASF` (`ASF`),
  ADD KEY `LD` (`LD`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `YBT` (`YBT`),
  ADD KEY `COU` (`COU`),
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `BDC` (`BDC`),
  ADD KEY `PARQ` (`PARQ`),
  ADD KEY `BREO` (`BREO`),
  ADD KEY `STY` (`STY`),
  ADD KEY `PDR` (`PDR`);

--
-- Indexes for table `mpMANUimages`
--
ALTER TABLE `mpMANUimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpMANUupdates`
--
ALTER TABLE `mpMANUupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpMANUwp`
--
ALTER TABLE `mpMANUwp`
  ADD PRIMARY KEY (`UniqueID`),
  ADD KEY `MLS_LN` (`LN`),
  ADD KEY `MLS_Date` (`PropertyDate`),
  ADD KEY `WP_PropertyDate` (`WP_PropertyDate`),
  ADD KEY `WP_Modified` (`WP_Modified`),
  ADD KEY `MLS_Vendor` (`MLS_Vendor`),
  ADD KEY `MLS_Status` (`Status`),
  ADD KEY `WP_Status` (`WP_Status`),
  ADD KEY `WP_PostID` (`WP_PostID`) USING BTREE;

--
-- Indexes for table `mpMULT`
--
ALTER TABLE `mpMULT`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `BR` (`BR`),
  ADD KEY `BTH` (`BTH`),
  ADD KEY `ASF` (`ASF`),
  ADD KEY `LD` (`LD`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `YBT` (`YBT`),
  ADD KEY `COU` (`COU`),
  ADD KEY `EffectiveYearBuilt` (`EffectiveYearBuilt`),
  ADD KEY `BDC` (`BDC`),
  ADD KEY `PARQ` (`PARQ`),
  ADD KEY `BREO` (`BREO`),
  ADD KEY `AVDT` (`AVDT`),
  ADD KEY `EXP` (`EXP`),
  ADD KEY `GAI` (`GAI`),
  ADD KEY `GSI` (`GSI`),
  ADD KEY `NOI` (`NOI`),
  ADD KEY `NOU` (`NOU`),
  ADD KEY `LSZ` (`LSZ`),
  ADD KEY `TEX` (`TEX`),
  ADD KEY `TIN` (`TIN`),
  ADD KEY `VAC` (`VAC`),
  ADD KEY `AMN` (`AMN`),
  ADD KEY `VEW` (`VEW`),
  ADD KEY `WFT` (`WFT`),
  ADD KEY `TRM` (`TRM`),
  ADD KEY `EffectiveYearBuiltSource` (`EffectiveYearBuiltSource`),
  ADD KEY `STY` (`STY`),
  ADD KEY `PDR` (`PDR`);

--
-- Indexes for table `mpMULTimages`
--
ALTER TABLE `mpMULTimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpMULTupdates`
--
ALTER TABLE `mpMULTupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpMULTwp`
--
ALTER TABLE `mpMULTwp`
  ADD PRIMARY KEY (`UniqueID`),
  ADD KEY `MLS_LN` (`LN`),
  ADD KEY `MLS_Date` (`PropertyDate`),
  ADD KEY `WP_PropertyDate` (`WP_PropertyDate`),
  ADD KEY `WP_Modified` (`WP_Modified`),
  ADD KEY `MLS_Vendor` (`MLS_Vendor`),
  ADD KEY `MLS_Status` (`Status`),
  ADD KEY `WP_Status` (`WP_Status`),
  ADD KEY `WP_PostID` (`WP_PostID`) USING BTREE;

--
-- Indexes for table `mpRENT`
--
ALTER TABLE `mpRENT`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `BR` (`BR`),
  ADD KEY `BTH` (`BTH`),
  ADD KEY `ASF` (`ASF`),
  ADD KEY `LDR` (`LDR`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `YBT` (`YBT`),
  ADD KEY `COU` (`COU`),
  ADD KEY `TYP` (`TYP`),
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `EffectiveYearBuiltSource` (`EffectiveYearBuiltSource`),
  ADD KEY `STY` (`STY`);

--
-- Indexes for table `mpRENTimages`
--
ALTER TABLE `mpRENTimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpRENTupdates`
--
ALTER TABLE `mpRENTupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpRESI`
--
ALTER TABLE `mpRESI`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `BR` (`BR`),
  ADD KEY `BTH` (`BTH`),
  ADD KEY `ASF` (`ASF`),
  ADD KEY `LD` (`LD`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `YBT` (`YBT`),
  ADD KEY `COU` (`COU`),
  ADD KEY `EffectiveYearBuilt` (`EffectiveYearBuilt`),
  ADD KEY `BDC` (`BDC`),
  ADD KEY `PARQ` (`PARQ`),
  ADD KEY `BREO` (`BREO`),
  ADD KEY `EffectiveYearBuiltSource` (`EffectiveYearBuiltSource`),
  ADD KEY `STY` (`STY`),
  ADD KEY `PDR` (`PDR`);

--
-- Indexes for table `mpRESIimages`
--
ALTER TABLE `mpRESIimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpRESIupdates`
--
ALTER TABLE `mpRESIupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpRESIwp`
--
ALTER TABLE `mpRESIwp`
  ADD PRIMARY KEY (`UniqueID`),
  ADD KEY `MLS_LN` (`LN`),
  ADD KEY `MLS_Date` (`PropertyDate`),
  ADD KEY `WP_PropertyDate` (`WP_PropertyDate`),
  ADD KEY `WP_Modified` (`WP_Modified`),
  ADD KEY `MLS_Vendor` (`MLS_Vendor`),
  ADD KEY `MLS_Status` (`Status`),
  ADD KEY `WP_Status` (`WP_Status`),
  ADD KEY `WP_PostID` (`WP_PostID`) USING BTREE;

--
-- Indexes for table `mpStatsByCity`
--
ALTER TABLE `mpStatsByCity`
  ADD PRIMARY KEY (`Seq`),
  ADD UNIQUE KEY `CityYearMonthPtyp` (`CityYearMonthPtype`),
  ADD KEY `Year` (`Year`),
  ADD KEY `City` (`City`),
  ADD KEY `Month` (`Month`),
  ADD KEY `PropertyType` (`PropertyType`),
  ADD KEY `TotalActive` (`TotalActive`),
  ADD KEY `TotalPending` (`TotalPending`),
  ADD KEY `TotalSold` (`TotalSold`),
  ADD KEY `AvgDaysToSell` (`AvgDaysToSell`),
  ADD KEY `AvgSalePricePerSqft` (`AvgPricePerSqft`),
  ADD KEY `AvgSalePrice` (`AvgSalePrice`),
  ADD KEY `AvgPricePerSqft` (`AvgPricePerSqft`),
  ADD KEY `AvgSPtoLPratio` (`AvgSPtoLPratio`),
  ADD KEY `Timestamp` (`Timestamp`),
  ADD KEY `MonthDate` (`MonthDate`);

--
-- Indexes for table `mpStatsByCounty`
--
ALTER TABLE `mpStatsByCounty`
  ADD PRIMARY KEY (`Seq`),
  ADD UNIQUE KEY `CountyYearMonthPtyp` (`CountyYearMonthPtype`),
  ADD KEY `Year` (`Year`),
  ADD KEY `County` (`County`),
  ADD KEY `Month` (`Month`),
  ADD KEY `PropertyType` (`PropertyType`),
  ADD KEY `TotalActive` (`TotalActive`),
  ADD KEY `TotalPending` (`TotalPending`),
  ADD KEY `TotalSold` (`TotalSold`),
  ADD KEY `AvgDaysToSell` (`AvgDaysToSell`),
  ADD KEY `AvgSalePricePerSqft` (`AvgPricePerSqft`),
  ADD KEY `AvgSalePrice` (`AvgSalePrice`),
  ADD KEY `AvgPricePerSqft` (`AvgPricePerSqft`),
  ADD KEY `AvgSPtoLPratio` (`AvgSPtoLPratio`),
  ADD KEY `Timestamp` (`Timestamp`),
  ADD KEY `MonthDate` (`MonthDate`);

--
-- Indexes for table `mpStatsByZip`
--
ALTER TABLE `mpStatsByZip`
  ADD PRIMARY KEY (`Seq`),
  ADD UNIQUE KEY `ZipYearMonthPtyp` (`ZipYearMonthPtype`),
  ADD KEY `Year` (`Year`),
  ADD KEY `Zip` (`Zip`),
  ADD KEY `Month` (`Month`),
  ADD KEY `PropertyType` (`PropertyType`),
  ADD KEY `TotalActive` (`TotalActive`),
  ADD KEY `TotalPending` (`TotalPending`),
  ADD KEY `TotalSold` (`TotalSold`),
  ADD KEY `AvgDaysToSell` (`AvgDaysToSell`),
  ADD KEY `AvgSalePricePerSqft` (`AvgPricePerSqft`),
  ADD KEY `AvgSalePrice` (`AvgSalePrice`),
  ADD KEY `AvgPricePerSqft` (`AvgPricePerSqft`),
  ADD KEY `AvgSPtoLPratio` (`AvgSPtoLPratio`),
  ADD KEY `Timestamp` (`Timestamp`),
  ADD KEY `MonthDate` (`MonthDate`);

--
-- Indexes for table `mpStatsUpdates`
--
ALTER TABLE `mpStatsUpdates`
  ADD PRIMARY KEY (`Seq`),
  ADD KEY `PeriodBeginDate` (`PeriodBeginDate`),
  ADD KEY `PeriodEndDate` (`PeriodEndDate`);

--
-- Indexes for table `mpVACL`
--
ALTER TABLE `mpVACL`
  ADD PRIMARY KEY (`LN`),
  ADD KEY `mpStyle` (`mpStyle`),
  ADD SPATIAL KEY `mpGeoPos` (`mpGeoPos`),
  ADD KEY `mpTimeStamp` (`mpTimeStamp`) USING BTREE,
  ADD KEY `UD` (`UD`) USING BTREE,
  ADD KEY `mpStatus` (`mpStatus`),
  ADD KEY `LP` (`LP`),
  ADD KEY `SP` (`SP`),
  ADD KEY `ZIP` (`ZIP`),
  ADD KEY `LSF` (`LSF`),
  ADD KEY `LD` (`LD`),
  ADD KEY `CLO` (`CLO`),
  ADD KEY `COU` (`COU`),
  ADD KEY `PARQ` (`PARQ`),
  ADD KEY `BREO` (`BREO`),
  ADD KEY `AVDT` (`AVDT`),
  ADD KEY `TRM` (`TRM`),
  ADD KEY `STY` (`STY`),
  ADD KEY `PDR` (`PDR`);

--
-- Indexes for table `mpVACLimages`
--
ALTER TABLE `mpVACLimages`
  ADD PRIMARY KEY (`ListingNumber`),
  ADD KEY `ListingStatus` (`ListingStatus`),
  ADD KEY `ActiveCount` (`ActiveCount`),
  ADD KEY `PendingRequest` (`PendingRequest`),
  ADD KEY `ReqStatus` (`ReqStatus`);

--
-- Indexes for table `mpVACLupdates`
--
ALTER TABLE `mpVACLupdates`
  ADD PRIMARY KEY (`Seq`);

--
-- Indexes for table `mpVACLwp`
--
ALTER TABLE `mpVACLwp`
  ADD PRIMARY KEY (`UniqueID`),
  ADD KEY `MLS_LN` (`LN`),
  ADD KEY `MLS_Date` (`PropertyDate`),
  ADD KEY `WP_PropertyDate` (`WP_PropertyDate`),
  ADD KEY `WP_Modified` (`WP_Modified`),
  ADD KEY `MLS_Vendor` (`MLS_Vendor`),
  ADD KEY `MLS_Status` (`Status`),
  ADD KEY `WP_Status` (`WP_Status`),
  ADD KEY `WP_PostID` (`WP_PostID`) USING BTREE;

--
-- Indexes for table `NWMLS_Lookup_Field_Names`
--
ALTER TABLE `NWMLS_Lookup_Field_Names`
  ADD PRIMARY KEY (`Field_Name`),
  ADD KEY `Field_Taxonomy` (`Field_Taxonomy`);

--
-- Indexes for table `NWMLS_Lookup_Field_Values`
--
ALTER TABLE `NWMLS_Lookup_Field_Values`
  ADD PRIMARY KEY (`Field_Value`);

--
-- Indexes for table `NWMLS_Members`
--
ALTER TABLE `NWMLS_Members`
  ADD PRIMARY KEY (`MemberMLSID`);

--
-- Indexes for table `NWMLS_Offices`
--
ALTER TABLE `NWMLS_Offices`
  ADD PRIMARY KEY (`OfficeMLSID`);

--
-- Indexes for table `rent-o-meter`
--
ALTER TABLE `rent-o-meter`
  ADD KEY `address` (`address`),
  ADD KEY `bedrooms` (`bedrooms`),
  ADD KEY `status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `mpCOMIupdates`
--
ALTER TABLE `mpCOMIupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3246;

--
-- AUTO_INCREMENT for table `mpCONDupdates`
--
ALTER TABLE `mpCONDupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3524;

--
-- AUTO_INCREMENT for table `mpMANUupdates`
--
ALTER TABLE `mpMANUupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3523;

--
-- AUTO_INCREMENT for table `mpMULTupdates`
--
ALTER TABLE `mpMULTupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3231;

--
-- AUTO_INCREMENT for table `mpRENTupdates`
--
ALTER TABLE `mpRENTupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3515;

--
-- AUTO_INCREMENT for table `mpRESIupdates`
--
ALTER TABLE `mpRESIupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3559;

--
-- AUTO_INCREMENT for table `mpStatsByCity`
--
ALTER TABLE `mpStatsByCity`
  MODIFY `Seq` bigint(8) NOT NULL AUTO_INCREMENT COMMENT 'Sequence (Auto Increment)', AUTO_INCREMENT=197949;

--
-- AUTO_INCREMENT for table `mpStatsByCounty`
--
ALTER TABLE `mpStatsByCounty`
  MODIFY `Seq` bigint(8) NOT NULL AUTO_INCREMENT COMMENT 'Sequence (Auto Increment)', AUTO_INCREMENT=27602;

--
-- AUTO_INCREMENT for table `mpStatsByZip`
--
ALTER TABLE `mpStatsByZip`
  MODIFY `Seq` bigint(8) NOT NULL AUTO_INCREMENT COMMENT 'Sequence (Auto Increment)', AUTO_INCREMENT=264374;

--
-- AUTO_INCREMENT for table `mpStatsUpdates`
--
ALTER TABLE `mpStatsUpdates`
  MODIFY `Seq` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Sequence (Auto Increment)', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `mpVACLupdates`
--
ALTER TABLE `mpVACLupdates`
  MODIFY `Seq` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Auto incrementing seq number', AUTO_INCREMENT=3036;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
