import com.boolint.gifttax.taxutil.*;
import java.util.Random;

// GiftTax 의 실제 taxutil 패키지를 그대로 컴파일해 입력과 결과 비트를 출력한다 → gifttax-parity.js 가 비교
//   G presenter giftAmount marriage noTax burden alreadyGift alreadyPaid appraisal grandSon minor jagyung priorTaxBase → final calc34 base credit
//   H buyPrice presenterQty jojung excess totalHouse standard lineal → chiRate totalPrice      E buyPrice → totalPrice
public class GiftTaxParity {
    static Random rnd = new Random(20261027L);
    static double pick(double[] a) { return a[rnd.nextInt(a.length)]; }
    static long b(double d) { return Double.doubleToLongBits(d); }
    public static void main(String[] args) {
        double[] GA = {0, 1e6, 2e7, 5e7, 5.05e7, 123456789, 3e8, 6e8, 7.5e8, 9.5e8, 1.5e9, 2.1e9, 3.5e9, 5e9};
        double[] BU = {0, 0, 1e7, 1e8, 3e8}, NT = {0, 1e6, 2e7}, AG = {0, 3e7, 2e8}, AP = {0, 1e6, 5e7}, AR = {0, 3e6, 7e6}, MB = {0, 5e7, 1.5e8}, PTB = {-1, -1, 0, 5e7, 1e8};
        Presenter[] PR = Presenter.values();
        StringBuilder sb = new StringBuilder();
        int n = 0;
        for (int i = 0; i < 8000; i++) {
            Presenter p = PR[rnd.nextInt(PR.length)];
            double ga = rnd.nextInt(3) == 0 ? (double) (rnd.nextInt(500000) + 1) * 10000 : pick(GA);   // 실거래 분포도 섞는다
            double mb = pick(MB), nt = pick(NT), bu = pick(BU), ag = pick(AG), ap = pick(AP), ar = pick(AR), ptb = pick(PTB);
            boolean gs = rnd.nextBoolean(), mi = rnd.nextBoolean(), ja = rnd.nextInt(4) == 0;
            GiftTax g = new GiftTax();
            g.setGiftTaxData(GiftObject.HOUSE, p, ga, mb, nt, bu, ag, ap, ar, gs, mi, ja, ptb);
            sb.append("G\t").append(p.name()).append('\t').append(b(ga)).append('\t').append(b(mb)).append('\t').append(b(nt)).append('\t').append(b(bu))
              .append('\t').append(b(ag)).append('\t').append(b(ap)).append('\t').append(b(ar)).append('\t').append(gs).append('\t').append(mi).append('\t').append(ja)
              .append('\t').append(b(ptb)).append('\t').append(b(g.getFinalGiftTax())).append('\t').append(b(g.getCalculationAmount34())).append('\t').append(b(g.getPriorTaxCredit())).append('\n');
            n++;
        }
        double[] SP = {0, 1e8, 2.99e8, 3e8, 5e8};
        for (int i = 0; i < 4000; i++) {
            double bp = (double) (rnd.nextInt(500000) + 1) * 10000;
            int pq = 1 + rnd.nextInt(3); boolean jo = rnd.nextBoolean(), ex = rnd.nextBoolean(), ln = rnd.nextBoolean();
            double th = rnd.nextBoolean() ? 0 : bp * 1.5, sp = pick(SP);
            AcqTax t = new AcqTax();
            t.setHouseData(bp, AcqReason.GIFT, pq, 1, jo, false, ex, th, sp, ln);
            sb.append("H\t").append(b(bp)).append('\t').append(pq).append('\t').append(jo).append('\t').append(ex).append('\t').append(b(th)).append('\t').append(b(sp)).append('\t').append(ln)
              .append('\t').append(b(t.getChiRate())).append('\t').append(b(t.getTotalPrice())).append('\n');
            AcqTax e = new AcqTax();
            e.setEtcData(bp, AcqReason.GIFT);
            sb.append("E\t").append(b(bp)).append('\t').append(b(e.getTotalPrice())).append('\n');
            n += 2;
        }
        System.out.print(sb);
        System.err.println("cases " + n);
    }
}
