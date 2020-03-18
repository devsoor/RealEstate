USE rp_nwmls;

DROP PROCEDURE IF EXISTS PROP_TO_LAMBDA;
DELIMITER ;;
CREATE PROCEDURE PROP_TO_LAMBDA (
	IN LN int(8) UNSIGNED,
	IN PTYP char(4),
	IN LAG int(6) UNSIGNED,
	IN ST char(5),
	IN LP decimal(11,2) UNSIGNED,
	IN SP decimal(11,2) UNSIGNED,
	IN OLP decimal(11,2) UNSIGNED,
	IN HSN int(10) UNSIGNED,
	IN DRP char(4),
	IN STR varchar(30),
	IN SSUF char(6),
	IN DRS char(4),
	IN UNT char(5),
	IN CIT varchar(21),
	IN STA char(2),
	IN ZIP char(5),
	IN PL4 char(4),
	IN BR decimal(4,2),
	IN BTH decimal(4,2),
	IN ASF int(10) UNSIGNED,
	IN LSF int(10) UNSIGNED,
	IN UD datetime,
	IN LDR datetime,
	IN LD datetime,
	IN CLO datetime,
	IN AR smallint(5) UNSIGNED,	
    IN MR varchar(1000),
	IN PIC tinyint(3) UNSIGNED,
    IN PARQ char(1),
    IN BREO char(1),
    IN BDC char(1),
	IN YBT smallint(5) UNSIGNED,
	IN `LONG` decimal(9,6),
	IN LAT decimal(8,6),
    IN NC char(1),
    IN NewConstruction char(1),
	IN LotSizeSource varchar(30),
	IN EffectiveYearBuilt smallint(5) UNSIGNED,
	IN EffectiveYearBuiltSource char(2),
	IN mpStatus char(1),
	IN mpStyle tinyint(3) UNSIGNED,
	IN mpGeoPos geometry,
	IN mpTimeStamp timestamp,
	IN LO smallint(5) UNSIGNED,
	IN TAX varchar(40),
	IN MAP varchar(10),
	IN GRDX char(4),
	IN GRDY char(4),
	IN SAG int(6) UNSIGNED,
	IN SO smallint(5) UNSIGNED,
	IN NIA char(1),
	IN CLA int(6) UNSIGNED,
	IN SHOADR char(1),
	IN COU varchar(21),
	IN CDOM tinyint(3) UNSIGNED,
	IN SCA int(6) UNSIGNED,
	IN SCO smallint(5) UNSIGNED,
	IN SD char(4),
	IN MAPBOOK char(4),
	IN DSR varchar(40),
	IN HSNA char(8),
	IN COLO smallint(5) UNSIGNED,
	IN EL varchar(20),
	IN FP tinyint(3) UNSIGNED,
	IN FUR char(1),
	IN JH varchar(20),
	IN LT varchar(40),
	IN MLT tinyint(2) UNSIGNED,
	IN POL char(1),
	IN PRJ varchar(50),
	IN SH varchar(20),
	IN SML char(1),
	IN STO char(1),
	IN STY char(2),
	IN AFR varchar(32),
	IN APP varchar(32),
	IN BSM varchar(12),
	IN CTD char(8),
	IN ENS varchar(24),
	IN GR varchar(20),
	IN HTC varchar(40),
	IN MIF varchar(16),
	IN SIT varchar(52),
	IN SWR varchar(14),
	IN TMC varchar(12),
	IN TYP char(8),
	IN UTL varchar(24),
	IN VEW varchar(28),
	IN WFT varchar(36),
    IN HOD int(6) UNSIGNED,
    IN FEA varchar(60),
    IN ActiveCount int(6) UNSIGNED,
    IN NOU smallint(4),
    IN BR1 decimal(4,2),
	IN BA1 decimal(4,2),
	IN BR2 decimal(4,2),
	IN BA2 decimal(4,2),
	IN BR3 decimal(4,2),
	IN BA3 decimal(4,2),
	IN BR4 decimal(4,2),
	IN BA4 decimal(4,2),
	IN BR5 decimal(4,2),
	IN BA5 decimal(4,2),
	IN BR6 decimal(4,2),
	IN BA6 decimal(4,2)
) LANGUAGE SQL 
BEGIN
  -- SELECT FirstName INTO @ListingAgentName FROM NWMLS_Members WHERE MemberMLSID=LAG;
  SELECT OfficeName, OfficePhone, EMailAddress, WebPageAddress INTO @LOName, @LOPhone, @LOEmail, @WebPageAddress FROM NWMLS_Offices WHERE OfficeMLSID=LO;
  CALL mysql.lambda_async('arn:aws:lambda:us-west-2:450322736372:function:search-prod-publish', 
     JSON_OBJECT("LN", LN, 
		 "PTYP", PTYP,
		 "LAG", LAG,
		 "ST", ST,
		 "LP", LP,
		 "SP", SP,
         "OLP", OLP,
		 "HSN", HSN,
		 "DRP", DRP,
		 "STR", STR,
		 "SSUF", SSUF,
		 "DRS", DRS,
		 "UNT", UNT,
		 "CIT", CIT,
		 "STA", STA,
		 "ZIP", ZIP,
		 "PL4", PL4,
		 "BR", BR,
		 "BTH", BTH,
		 "ASF", ASF,
		 "LSF", LSF,
		 "UD", UD,
		 "AR", AR,
         "LD", LD,
		 "LDR", LDR,
		 "CLO", CLO,
		 "MR", MR,
		 "YBT", YBT,
		 "LO", LO,
         "LOName", @LOName,
         "LOPhone", @LOPhone,
         "LOEmail", @LOEmail,
         "LOWebsite", @LOWebsite,
		 "TAX", TAX,
		 "MAP", MAP,
		 "GRDX", GRDX,
		 "GRDY", GRDY,
		 "SAG", SAG,
		 "SO", SO,
		 "NIA", NIA,
		 "LONG", `LONG`,
		 "LAT", LAT,
		 "CLA", CLA,
		 "SHOADR", SHOADR,
		 "COU", COU,
		 "CDOM", CDOM,
		 "SCA", SCA,
		 "SCO", SCO,
		 "SD", SD,
		 "MAPBOOK", MAPBOOK,
		 "DSR", DSR,
		 "HSNA", HSNA,
		 "COLO", COLO,
		 "PIC", PIC,
		 "EL", EL,
		 "FP", FP,
		 "FUR", FUR,
		 "JH", JH,
		 "LT", LT,
		 "MLT", MLT,
		 "POL", POL,
		 "PRJ", PRJ,
		 "SH", SH,
		 "SML", SML,
		 "STO", STO,
		 "STY", STY,
		 "AFR", AFR,
		 "APP", APP,
		 "BSM", BSM,
		 "CTD", CTD,
		 "ENS", ENS,
		 "GR", GR,
		 "HTC", HTC,
		 "MIF", MIF,
		 "SIT", SIT,
		 "SWR", SWR,
		 "TMC", TMC,
		 "TYP", TYP,
		 "UTL", UTL,
		 "VEW", VEW,
		 "WFT", WFT,	
         "PARQ", PARQ, --  
         "BREO", BREO, --
         "BDC", BDC, -- 
         "HOD", HOD,
         "NC", NC,
         "NOU", NOU,
         "BR1", BR1, "BA1", BA1,	
         "BR2", BR2, "BA2", BA2,	
         "BR3", BR3, "BA3", BA3,	
         "BR4", BR4, "BA4", BA4,
         "BR5", BR5, "BA5", BA5,
		 "BR6", BR6, "BA6", BA6,
         "NewConstruction", NewConstruction,
		 "LotSizeSource", LotSizeSource,
		 "EffectiveYearBuilt", EffectiveYearBuilt,
		 "EffectiveYearBuiltSource", EffectiveYearBuiltSource,
		 "mpStatus", mpStatus,
		 "mpStyle", mpStyle,
		 "mpGeoPos", ST_AsText(mpGeoPos),
		 "mpTimeStamp", mpTimeStamp,
         "FEA", FEA, 
         "ActiveCount", ActiveCount)
     );
END
;;
DELIMITER ;


-- Trigger on RENT insert or update
DROP TRIGGER IF EXISTS TR_mpRENT_Insert;
DELIMITER ;;
CREATE TRIGGER TR_mpRENT_Insert
  AFTER INSERT ON mpRENT
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpRENTimages where mpRENTimages.ListingNumber=NEW.LN);
  SELECT  NEW.LN, NEW.PTYP, NEW.LAG, NEW.ST, NEW.LP, NEW.SP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.PL4, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD , NEW.AR, NEW.LDR , NEW.CLO , NEW.YBT, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.MR, NEW.`LONG`, NEW.LAT, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.PIC, NEW.EL, NEW.FP, NEW.FUR, NEW.JH, NEW.LT, NEW.MLT, NEW.POL, NEW.PRJ, NEW.SH, NEW.SML, NEW.STO, NEW.STY, NEW.AFR, NEW.APP, NEW.BSM, NEW.CTD, NEW.ENS, NEW.GR, NEW.HTC, NEW.MIF, NEW.SIT, NEW.SWR, NEW.TMC, NEW.TYP, NEW.UTL, NEW.VEW, NEW.WFT, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp
  INTO @LN, @PTYP, @LAG, @ST, @LP, @SP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @PL4, @BR, @BTH, @ASF, @LSF, @UD , @AR, @LDR , @CLO , @YBT, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @MR, @`LONG`, @LAT, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @PIC, @EL, @FP, @FUR, @JH, @LT, @MLT, @POL, @PRJ, @SH, @SML, @STO, @STY, @AFR, @APP, @BSM, @CTD, @ENS, @GR, @HTC, @MIF, @SIT, @SWR, @TMC, @TYP, @UTL, @VEW, @WFT, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, @LAG, @ST, @LP, @SP, null, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @PL4, @BR, @BTH, @ASF, @LSF, @UD, @LDR, null,@CLO, @AR, @MR, @PIC, null,  null, null, @YBT, @`LONG`, @LAT, null, null, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA,  @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO,@EL, @FP, @FUR, @JH, @LT, @MLT, @POL, @PRJ, @SH, @SML, @STO, @STY, @AFR, @APP, @BSM, @CTD, @ENS, @GR, @HTC, @MIF, @SIT, @SWR, @TMC, @TYP, @UTL, @VEW, @WFT, null, null, @activepics, null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;


DROP TRIGGER IF EXISTS TR_mpRENT_Update;
DELIMITER ;;
CREATE TRIGGER TR_mpRENT_Update
  AFTER UPDATE ON mpRENT
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpRENTimages where mpRENTimages.ListingNumber=NEW.LN);
  SELECT  NEW.LN, NEW.PTYP, NEW.LAG, NEW.ST, NEW.LP, NEW.SP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.PL4, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD , NEW.AR, NEW.LDR , NEW.CLO , NEW.YBT, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.MR, NEW.`LONG`, NEW.LAT, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.PIC, NEW.EL, NEW.FP, NEW.FUR, NEW.JH, NEW.LT, NEW.MLT, NEW.POL, NEW.PRJ, NEW.SH, NEW.SML, NEW.STO, NEW.STY, NEW.AFR, NEW.APP, NEW.BSM, NEW.CTD, NEW.ENS, NEW.GR, NEW.HTC, NEW.MIF, NEW.SIT, NEW.SWR, NEW.TMC, NEW.TYP, NEW.UTL, NEW.VEW, NEW.WFT, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp
  INTO @LN, @PTYP, @LAG, @ST, @LP, @SP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @PL4, @BR, @BTH, @ASF, @LSF, @UD , @AR, @LDR , @CLO , @YBT, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @MR, @`LONG`, @LAT, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @PIC, @EL, @FP, @FUR, @JH, @LT, @MLT, @POL, @PRJ, @SH, @SML, @STO, @STY, @AFR, @APP, @BSM, @CTD, @ENS, @GR, @HTC, @MIF, @SIT, @SWR, @TMC, @TYP, @UTL, @VEW, @WFT, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, @LAG, @ST, @LP, @SP, null, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @PL4, @BR, @BTH, @ASF, @LSF, @UD, @LDR, null,@CLO, @AR, @MR, @PIC, null,  null, null, @YBT, @`LONG`, @LAT, null, null, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA,  @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO,@EL, @FP, @FUR, @JH, @LT, @MLT, @POL, @PRJ, @SH, @SML, @STO, @STY, @AFR, @APP, @BSM, @CTD, @ENS, @GR, @HTC, @MIF, @SIT, @SWR, @TMC, @TYP, @UTL, @VEW, @WFT, null, null, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;


-- Trigger on COND insert or update
DROP TRIGGER IF EXISTS TR_mpCOND_Insert;
DELIMITER ;;
CREATE TRIGGER TR_mpCOND_Insert
  AFTER INSERT ON mpCOND
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpCONDimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.YBT, NEW.LONG, NEW.LAT, NEW.NC, NEW.NewConstruction, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.FP, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT, NEW.HOD
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @YBT, @LONG, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, @JH, @PRJ, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT, @HOD;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, null, @YBT, @`LONG`, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, @HOD, null, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;

DROP TRIGGER IF EXISTS TR_mpCOND_Update;
DELIMITER ;;
CREATE TRIGGER TR_mpCOND_Update
  AFTER UPDATE ON mpCOND
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpCONDimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.YBT, NEW.LONG, NEW.LAT, NEW.NC, NEW.NewConstruction, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.FP, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT, NEW.HOD
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @YBT, @LONG, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, @JH, @PRJ, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT, @HOD;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, null, @YBT, @`LONG`, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, @HOD, null, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;


-- Trigger on RESI insert or update
DROP TRIGGER IF EXISTS TR_mpRESI_Insert;
DELIMITER ;;
CREATE TRIGGER TR_mpRESI_Insert
  AFTER INSERT ON mpRESI
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpRESIimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.BDC, NEW.YBT, NEW.LONG, NEW.LAT, NEW.NC, NEW.NewConstruction, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.FP, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT, NEW.HOD, NEW.FEA
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @LONG, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, @JH, @PRJ, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT, @HOD, @FEA;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @`LONG`, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, @HOD, @FEA, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;

DROP TRIGGER IF EXISTS TR_mpRESI_Update;
DELIMITER ;;
CREATE TRIGGER TR_mpRESI_Update
  AFTER UPDATE ON mpRESI
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpRESIimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.BDC, NEW.YBT, NEW.LONG, NEW.LAT, NEW.NC, NEW.NewConstruction, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.FP, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT, NEW.HOD, New.FEA
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @LONG, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, @JH, @PRJ, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT, @HOD, @FEA;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @`LONG`, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, @HOD, @FEA, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;


-- Trigger on MANU insert or update
DROP TRIGGER IF EXISTS TR_mpMANU_Insert;
DELIMITER ;;
CREATE TRIGGER TR_mpMANU_Insert
  AFTER INSERT ON mpMANU
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpMANUimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.BDC, NEW.YBT, NEW.LONG, NEW.LAT, NEW.LotSizeSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.FP, NEW.JH, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @LONG, @LAT, @LotSizeSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, @JH, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @`LONG`, @LAT, null, null, @LotSizeSource, null, null, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, null, @JH, null, null, null, null, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, null, null, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;

DROP TRIGGER IF EXISTS TR_mpMANU_Update;
DELIMITER ;;
CREATE TRIGGER TR_mpMANU_Update
  AFTER UPDATE ON mpMANU
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpMANUimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.BDC, NEW.YBT, NEW.LONG, NEW.LAT, NEW.LotSizeSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.FP, NEW.JH, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @LONG, @LAT, @LotSizeSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, @JH, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @`LONG`, @LAT, null, null, @LotSizeSource, null, null, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @FP, null, @JH, null, null, null, null, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, null, null, @activepics,  null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;



-- Trigger on VACL insert or update
DROP TRIGGER IF EXISTS TR_mpVACL_Insert;
DELIMITER ;;
CREATE TRIGGER TR_mpVACL_Insert
  AFTER INSERT ON mpVACL
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpVACLimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.LONG, NEW.LAT, NEW.LotSizeSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.VEW, NEW.WFT
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @LONG, @LAT, @LotSizeSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @JH, @PRJ, @SH, @SML, @STY, @VEW, @WFT;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, null, null, null, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, null, null, @`LONG`, @LAT, null, null,@LotSizeSource, null, null, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, null, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, null, null, null, null, null, null, null, @VEW, @WFT, null, null, @activepics, null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;

DROP TRIGGER IF EXISTS TR_mpVACL_Update;
DELIMITER ;;
CREATE TRIGGER TR_mpVACL_Update
  AFTER UPDATE ON mpVACL
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpVACLimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP,  NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.LONG, NEW.LAT, NEW.LotSizeSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.VEW, NEW.WFT
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @LONG, @LAT, @LotSizeSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @JH, @PRJ, @SH, @SML, @STY, @VEW, @WFT;
  CALL  PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, null, null, null, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, null, null, @`LONG`, @LAT, null, null, @LotSizeSource, null, null, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, null, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, null, null, null, null, null, null, null, @VEW, @WFT, null, null, @activepics, null, null, null, null, null, null, null, null, null, null, null, null, null);
END
;;
DELIMITER ;

DROP PROCEDURE IF EXISTS MULT_PROP_TO_LAMBDA;
DELIMITER ;;
CREATE PROCEDURE MULT_PROP_TO_LAMBDA (
	IN LN int(8) UNSIGNED,
	IN PTYP char(4),
	IN LAG int(6) UNSIGNED,
	IN ST char(5),
	IN LP decimal(11,2) UNSIGNED,
	IN SP decimal(11,2) UNSIGNED,
	IN OLP decimal(11,2) UNSIGNED,
	IN HSN int(10) UNSIGNED,
	IN DRP char(4),
	IN STR varchar(30),
	IN SSUF char(6),
	IN DRS char(4),
	IN UNT char(5),
	IN CIT varchar(21),
	IN STA char(2),
	IN ZIP char(5),
	IN PL4 char(4),
	IN BR decimal(4,2),
	IN BTH decimal(4,2),
	IN ASF int(10) UNSIGNED,
	IN LSF int(10) UNSIGNED,
	IN UD datetime,
	IN LDR datetime,
	IN LD datetime,
	IN CLO datetime,
	IN AR smallint(5) UNSIGNED,	
    IN MR varchar(1000),
	IN PIC tinyint(3) UNSIGNED,
    IN PARQ char(1),
    IN BREO char(1),
    IN BDC char(1),
	IN YBT smallint(5) UNSIGNED,
	IN `LONG` decimal(9,6),
	IN LAT decimal(8,6),
    IN NC char(1),
    IN NewConstruction char(1),
	IN LotSizeSource varchar(30),
	IN EffectiveYearBuilt smallint(5) UNSIGNED,
	IN EffectiveYearBuiltSource char(2),
	IN mpStatus char(1),
	IN mpStyle tinyint(3) UNSIGNED,
	IN mpGeoPos geometry,
	IN mpTimeStamp timestamp,
	IN LO smallint(5) UNSIGNED,
	IN TAX varchar(40),
	IN MAP varchar(10),
	IN GRDX char(4),
	IN GRDY char(4),
	IN SAG int(6) UNSIGNED,
	IN SO smallint(5) UNSIGNED,
	IN NIA char(1),
	IN CLA int(6) UNSIGNED,
	IN SHOADR char(1),
	IN COU varchar(21),
	IN CDOM tinyint(3) UNSIGNED,
	IN SCA int(6) UNSIGNED,
	IN SCO smallint(5) UNSIGNED,
	IN SD char(4),
	IN MAPBOOK char(4),
	IN DSR varchar(40),
	IN HSNA char(8),
	IN COLO smallint(5) UNSIGNED,
	IN EL varchar(20),
	IN FP tinyint(3) UNSIGNED,
	IN FUR char(1),
	IN JH varchar(20),
	IN LT varchar(40),
	IN MLT tinyint(2) UNSIGNED,
	IN POL char(1),
	IN PRJ varchar(50),
	IN SH varchar(20),
	IN SML char(1),
	IN STO char(1),
	IN STY char(2),
	IN AFR varchar(32),
	IN APP varchar(32),
	IN BSM varchar(12),
	IN CTD char(8),
	IN ENS varchar(24),
	IN GR varchar(20),
	IN HTC varchar(40),
	IN MIF varchar(16),
	IN SIT varchar(52),
	IN SWR varchar(14),
	IN TMC varchar(12),
	IN TYP char(8),
	IN UTL varchar(24),
	IN VEW varchar(28),
	IN WFT varchar(36),
    IN HOD int(6) UNSIGNED,
    IN FEA varchar(60),
    IN ActiveCount int(6) UNSIGNED,
    IN NOU smallint(4),
	IN UN1 varchar(40),
    IN BR1 decimal(4,2),
	IN BA1 decimal(4,2),
	IN SF1 int(4),
	IN UN2 varchar(40),
	IN BR2 decimal(4,2),
	IN BA2 decimal(4,2),
	IN SF2 int(4),
	IN UN3 varchar(40),
	IN BR3 decimal(4,2),
	IN BA3 decimal(4,2),
	IN SF3 int(4),
	IN UN4 varchar(40),
	IN BR4 decimal(4,2),
	IN BA4 decimal(4,2),
	IN SF4 int(4),
	IN UN5 varchar(40),	
    IN BR5 decimal(4,2),
	IN BA5 decimal(4,2),
	IN SF5 int(4),
	IN UN6 varchar(40),
	IN BR6 decimal(4,2),
	IN BA6 decimal(4,2),
	IN SF6 int(4)
) LANGUAGE SQL 
BEGIN
  -- SELECT FirstName INTO @ListingAgentName FROM NWMLS_Members WHERE MemberMLSID=LAG;
  SELECT OfficeName, OfficePhone, EMailAddress, WebPageAddress INTO @LOName, @LOPhone, @LOEmail, @WebPageAddress FROM NWMLS_Offices WHERE OfficeMLSID=LO;
  CALL mysql.lambda_async('arn:aws:lambda:us-west-2:450322736372:function:search-prod-publish', 
     JSON_OBJECT("LN", LN, 
		 "PTYP", PTYP,
		 "LAG", LAG,
		 "ST", ST,
		 "LP", LP,
		 "SP", SP,
         "OLP", OLP,
		 "HSN", HSN,
		 "DRP", DRP,
		 "STR", STR,
		 "SSUF", SSUF,
		 "DRS", DRS,
		 "UNT", UNT,
		 "CIT", CIT,
		 "STA", STA,
		 "ZIP", ZIP,
		 "PL4", PL4,
		 "BR", BR,
		 "BTH", BTH,
		 "ASF", ASF,
		 "LSF", LSF,
		 "UD", UD,
		 "AR", AR,
         "LD", LD,
		 "LDR", LDR,
		 "CLO", CLO,
		 "MR", MR,
		 "YBT", YBT,
		 "LO", LO,
         "LOName", @LOName,
         "LOPhone", @LOPhone,
         "LOEmail", @LOEmail,
         "LOWebsite", @LOWebsite,
		 "TAX", TAX,
		 "MAP", MAP,
		 "GRDX", GRDX,
		 "GRDY", GRDY,
		 "SAG", SAG,
		 "SO", SO,
		 "NIA", NIA,
		 "LONG", `LONG`,
		 "LAT", LAT,
		 "CLA", CLA,
		 "SHOADR", SHOADR,
		 "COU", COU,
		 "CDOM", CDOM,
		 "SCA", SCA,
		 "SCO", SCO,
		 "SD", SD,
		 "MAPBOOK", MAPBOOK,
		 "DSR", DSR,
		 "HSNA", HSNA,
		 "COLO", COLO,
		 "PIC", PIC,
		 "EL", EL,
		 "FP", FP,
		 "FUR", FUR,
		 "JH", JH,
		 "LT", LT,
		 "MLT", MLT,
		 "POL", POL,
		 "PRJ", PRJ,
		 "SH", SH,
		 "SML", SML,
		 "STO", STO,
		 "STY", STY,
		 "AFR", AFR,
		 "APP", APP,
		 "BSM", BSM,
		 "CTD", CTD,
		 "ENS", ENS,
		 "GR", GR,
		 "HTC", HTC,
		 "MIF", MIF,
		 "SIT", SIT,
		 "SWR", SWR,
		 "TMC", TMC,
		 "TYP", TYP,
		 "UTL", UTL,
		 "VEW", VEW,
		 "WFT", WFT,	
         "PARQ", PARQ, --  
         "BREO", BREO, --
         "BDC", BDC, -- 
         "HOD", HOD,
         "NC", NC,
         "NOU", NOU,
         "BR1", BR1, "BA1", BA1, "SF1", SF1, "UN1", UN1,
         "BR2", BR2, "BA2", BA2, "SF2", SF2, "UN2", UN2,	
         "BR3", BR3, "BA3", BA3, "SF3", SF3, "UN3", UN3,
         "BR4", BR4, "BA4", BA4, "SF4", SF4, "UN4", UN4,
         "BR5", BR5, "BA5", BA5, "SF5", SF5, "UN5", UN5,
		 "BR6", BR6, "BA6", BA6, "SF6", SF6, "UN6", UN6,
         "NewConstruction", NewConstruction,
		 "LotSizeSource", LotSizeSource,
		 "EffectiveYearBuilt", EffectiveYearBuilt,
		 "EffectiveYearBuiltSource", EffectiveYearBuiltSource,
		 "mpStatus", mpStatus,
		 "mpStyle", mpStyle,
		 "mpGeoPos", ST_AsText(mpGeoPos),
		 "mpTimeStamp", mpTimeStamp,
         "FEA", FEA, 
         "ActiveCount", ActiveCount)
     );
END
;;
DELIMITER ;

-- Trigger on MULT insert or update
DROP TRIGGER IF EXISTS TR_mpMULT_Insert;
DELIMITER ;;
CREATE TRIGGER TR_mpMULT_Insert
	AFTER INSERT ON mpMULT
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpMULTimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.BDC, NEW.YBT, NEW.LONG, NEW.LAT, NEW.NC, NEW.NewConstruction, NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT, NEW.HOD, NEW.NOU, NEW.UN1, NEW.BR1, NEW.BA1, NEW.SF1, NEW.UN2, NEW.BR2, NEW.BA2, NEW.SF2, NEW.UN3, NEW.BR3, NEW.BA3, NEW.SF3, NEW.UN4, NEW.BR4, NEW.BA4, NEW.SF4, NEW.UN5, NEW.BR5, NEW.BA5, NEW.SF5, NEW.UN6, NEW.BR6, NEW.BA6, NEW.SF6
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @LONG, @LAT, @NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @JH, @PRJ, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT, @HOD, @NOU, @UN1, @BR1, @BA1, @SF1, @UN2, @BR2, @BA2, @SF2, @UN3, @BR3, @BA3, @SF3, @UN4, @BR4, @BA4, @SF4, @UN5, @BR5, @BA5, @SF5, @UN6, @BR6, @BA6, @SF6;
  CALL  MULT_PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @`LONG`, @LAT, @NC, @NewConstruction,@LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, null, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, @HOD, null, @activepics, @NOU, @UN1, @BR1, @BA1, @SF1, @UN2, @BR2, @BA2, @SF2, @UN3, @BR3, @BA3, @SF3, @UN4, @BR4, @BA4, @SF4, @UN5, @BR5, @BA5, @SF5, @UN6, @BR6, @BA6, @SF6);
END
;;
DELIMITER ;

DROP TRIGGER IF EXISTS TR_mpMULT_Update;
DELIMITER ;;
CREATE TRIGGER TR_mpMULT_Update
  AFTER UPDATE ON mpMULT
  FOR EACH ROW
BEGIN
  SET @activepics = (SELECT ActiveCount FROM mpMULTimages i where i.ListingNumber=NEW.LN);
  SELECT NEW.LN, NEW.PTYP, NEW.ST, NEW.LP, NEW.SP, NEW.OLP, NEW.HSN, NEW.DRP, NEW.STR, NEW.SSUF, NEW.DRS, NEW.UNT, NEW.CIT, NEW.STA, NEW.ZIP, NEW.BR, NEW.BTH, NEW.ASF, NEW.LSF, NEW.UD, NEW.LDR, NEW.LD, NEW.CLO, NEW.AR, NEW.MR, NEW.PIC, NEW.PARQ, NEW.BREO, NEW.BDC, NEW.YBT, NEW.LONG, NEW.LAT, NEW.NC, NEW.NewConstruction,NEW.LotSizeSource, NEW.EffectiveYearBuilt, NEW.EffectiveYearBuiltSource, NEW.mpStatus, NEW.mpStyle, NEW.mpGeoPos, NEW.mpTimeStamp, NEW.LO, NEW.TAX, NEW.MAP, NEW.GRDX, NEW.GRDY, NEW.SAG, NEW.SO, NEW.NIA, NEW.CLA, NEW.SHOADR, NEW.COU, NEW.CDOM, NEW.SCA, NEW.SCO, NEW.SD, NEW.MAPBOOK, NEW.DSR, NEW.HSNA, NEW.COLO, NEW.EL, NEW.JH, NEW.PRJ, NEW.SH, NEW.SML, NEW.STY, NEW.ENS, NEW.HTC, NEW.VEW, NEW.WFT, NEW.HOD, NEW.NOU, NEW.UN1, NEW.BR1, NEW.BA1, NEW.SF1, NEW.UN2, NEW.BR2, NEW.BA2, NEW.SF2, NEW.UN3, NEW.BR3, NEW.BA3, NEW.SF3, NEW.UN4, NEW.BR4, NEW.BA4, NEW.SF4, NEW.UN5, NEW.BR5, NEW.BA5, NEW.SF5, NEW.UN6, NEW.BR6, NEW.BA6, NEW.SF6
  INTO @LN, @PTYP, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @LONG, @LAT,@NC, @NewConstruction, @LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, @JH, @PRJ, @SH, @SML, @STY, @ENS, @HTC, @VEW, @WFT, @HOD, @NOU, @UN1, @BR1, @BA1, @SF1, @UN2, @BR2, @BA2, @SF2, @UN3, @BR3, @BA3, @SF3, @UN4, @BR4, @BA4, @SF4, @UN5, @BR5, @BA5, @SF5, @UN6, @BR6, @BA6, @SF6;
  CALL  MULT_PROP_TO_LAMBDA(@LN, @PTYP, null, @ST, @LP, @SP, @OLP, @HSN, @DRP, @STR, @SSUF, @DRS, @UNT, @CIT, @STA, @ZIP, null, @BR, @BTH, @ASF, @LSF, @UD, @LDR, @LD, @CLO, @AR, @MR, @PIC, @PARQ, @BREO, @BDC, @YBT, @`LONG`, @LAT, @NC, @NewConstruction,@LotSizeSource, @EffectiveYearBuilt, @EffectiveYearBuiltSource, @mpStatus, @mpStyle, @mpGeoPos, @mpTimeStamp, @LO, @TAX, @MAP, @GRDX, @GRDY, @SAG, @SO, @NIA, @CLA, @SHOADR, @COU, @CDOM, @SCA, @SCO, @SD, @MAPBOOK, @DSR, @HSNA, @COLO, @EL, null, null, @JH, null, null, null, @PRJ, @SH, @SML, null, @STY, null, null, null, null, @ENS, null, @HTC, null, null, null, null, null, null, @VEW, @WFT, @HOD, null, @activepics, @NOU, @UN1, @BR1, @BA1, @SF1, @UN2, @BR2, @BA2, @SF2, @UN3, @BR3, @BA3, @SF3, @UN4, @BR4, @BA4, @SF4, @UN5, @BR5, @BA5, @SF5, @UN6, @BR6, @BA6, @SF6);
END
;;
DELIMITER ;